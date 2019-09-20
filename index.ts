
export interface IValueWrapper<TValue> {

  /**
   * value, in the fromat you want
   */
  value: TValue,
  
  /**
   * timestamp, when the value is insert or update
   */
  timestamp: number,
}

export interface IOptions<TStorage, TValue> {

  /**
   * timestamp = currentTime / timeDivider
   */
  timeDivider?: number,

  /**
   * this option can override the combined cleanUp function
   */
  overrideCleanUp?: (ttl: number) => Promise<boolean>

  /**
   * getter return undefined/null means miss match the key
   */
  getter: (storage: TStorage, key: string) => Promise<IValueWrapper<TValue> | undefined | null>,
  setter: (storage: TStorage, key: string, valueWrapper: IValueWrapper<TValue>, ttl?: number) => Promise<IValueWrapper<TValue>>,
  remover?: (storage: TStorage, key: string) => any,
  iterater?: (storage: TStorage, cb: (v: IValueWrapper<TValue>, key: string) => void) => void,

  /**
   * trigger when get action find this,
   * timeout action is async
   */
  onTimeout?: (storage: TStorage, key: string, box: IValueWrapper<TValue>) => Promise<void>

  /**
   * 入侵式的修改，需要使用插件式的模式来添加功能。 TODO:
   */
  nextLevel?: ICache<TValue>
}

export interface ICache<TValue> {
  applyWith: (name: string, func: Function, ttl: number, params: any[]) => Promise<TValue>,
  wrapperWithCall: (name: string, func: Function, ttl: number) => (...params: any[]) => Promise<TValue>,

  /**
   * 'of' is an alias of wrapperWithCall
   */
  of: (name: string, func: Function, ttl: number) => (...params: any[]) => Promise<TValue>,
  cleanUp: (ttl: number) => Promise<any>,
  save: (key: string, value: TValue, ttl?: number) => Promise<IValueWrapper<TValue>>,
  load: (key: string, ttl?: number) => Promise<TValue | undefined>,
  timeDivider: () => number
}

const Hour = 3600
const Day = 24 * Hour

/**
 * 
 * TODO: opts: key generator,
 * in case of some storage do not support some charactor in key string
 * 
 * TODO: refacto this with a plugin style
 * 
 * save(key, value, ttl)
 * load(key, ttl)
 * cleanUp(ttl)
 * 
 * applyWith(name, func, ttl, params)
 * wrapperWithCall(name, func, ttl)
 * @param {*} storage 
 * @param {*} opts 
 */
export function createCache<TStorage, TValue>(
  storage: TStorage,
  opts: IOptions<TStorage, TValue>
): ICache<TValue> {
  let { getter, setter } = opts

  if (!getter || !setter) {
    throw new Error('create Cache must off getter and setter')
  }

  let timeDivider = opts.timeDivider || 1000
  let nextLevel = opts.nextLevel

  async function save (key: string, value: TValue, ttl: number = 0) {
    let currentTimestamp = Date.now() / timeDivider | 0
    // set to next level as a copy
    if (nextLevel) { nextLevel.save(key, value, ttl) }
    return setter(storage, key, { value, timestamp: currentTimestamp }, ttl)
  }

  async function load (key: string, ttl: number = Day) {
    let currentTimestamp = Date.now() / timeDivider | 0
    let box = await getter(storage, key)

    if (box) { // get the box
      let timestamp = box.timestamp || 0
      if (currentTimestamp - timestamp < ttl) { // in time
        return box.value
      }
      else if (opts.onTimeout) {
        opts.onTimeout(storage, key, box)
      }
    }
    else if (nextLevel) { // cache miss, not timeout
      let ret = await nextLevel.load(key, ttl)
      if (ret) {
        save(key, ret, ttl)
        return ret
      }
    }

    return undefined
  }

  // callWith('fetchName', fetchName, 3000, [id, token])
  async function applyWith (name: string, func: Function, ttl: number, params: any[]) {

    let key = JSON.stringify([name, params])
    let box = await getter(storage, key)

    let currentTimestamp = Date.now() / timeDivider | 0

    // call with cache
    if (box) {
      let timestamp = box.timestamp || 0
      if (currentTimestamp - timestamp < ttl) {
        // console.log('cache hit', box)
        return box.value
      }
      // else {
      //   console.log('cache is expired', box)
      // }
    }

    let value = await func.apply(null, params)
    // do not to await setter
    setter(storage, key, { value, timestamp: currentTimestamp })
    return value
  }

  // let fetchNameWithCache = wrapperWith('fetchName', fetchName, 3000)
  // fetchNameWithCache(id, token)
  function wrapperWithCall (name: string, func: Function, ttl: number) {
    return function (...params: any[]) {
      return applyWith(name, func, ttl, params)
    }
  }

  /**
   * cleanUp, use function from options or use iterater and delete
   * @param {number} ttl time to live
   */
  let cleanUp = opts.overrideCleanUp || (async function (ttl = Day) {
    let remover: (storage: TStorage, key: string) => any
    let iterater: (storage: TStorage, cb: (v: IValueWrapper<TValue>, key: string) => void) => void

    if (!opts.iterater || !opts.remover) {
      console.warn('create cache do not offer iterater and remover function, and this cleanup is skipped')
      return false
    }
    else {
      remover = opts.remover
      iterater = opts.iterater
    }

    await iterater(storage, (v, k) => {
      // remove when iterater may cause error in some storage
      if (!v || !v.value || !v.timestamp) {
        remover(storage, k)
      }
      else {
        let currentTimestamp = Date.now() / timeDivider | 0
        if (currentTimestamp - v.timestamp > ttl) {
          remover(storage, k)
        }
      }
    })

    return true
  })

  return {

    applyWith, wrapperWithCall, cleanUp, save, load, of: wrapperWithCall,

    timeDivider: function () {
      return timeDivider
    }
  }
}

export default createCache