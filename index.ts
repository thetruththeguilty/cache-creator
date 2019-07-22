
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
}

export interface ICache<TValue> {
  applyWith: (name: string, func: Function, ttl: number, params: any[]) => Promise<TValue>,
  wrapperWithCall: (name: string, func: Function, ttl: number) => (...params: any[]) => Promise<TValue>,
  cleanUp: (ttl: number) => Promise<any>,
  save: (key: string, value: TValue, ttl?: number) => Promise<IValueWrapper<TValue>>,
  load: (key: string, ttl?: number) => Promise<TValue | undefined>,
}

const Hour = 3600
const Day = 24 * Hour

/**
 * 
 * TODO: opts: key generator
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

  async function save (key: string, value: TValue, ttl: number = 0) {
    let currentTimestamp = Date.now() / timeDivider | 0
    return setter(storage, key, { value, timestamp: currentTimestamp }, ttl)
  }

  async function load (key: string, ttl: number = Day) {
    let currentTimestamp = Date.now() / timeDivider | 0
    let box = await getter(storage, key)
    if (box) {
      let timestamp = box.timestamp || 0
      if (currentTimestamp - timestamp < ttl) {
        return box.value
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
      console.warn('create cache do not offer iterater and remover function')
      return false
    }
    else {
      remover = opts.remover
      iterater = opts.iterater
    }

    await iterater(storage, (v, k) => {
      if (!v || !v.value || !v.timestamp) {
        // remove when iterater may cause error in some storage
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
    applyWith, wrapperWithCall, cleanUp, save, load,
  }
}

export default createCache