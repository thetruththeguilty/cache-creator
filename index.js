function createCache(storage, opts) {
  let { getter, setter } = opts

  if (!getter || !setter) {
    throw new Error('create Cache must off getter and setter')
  }

  async function save (key, value) {
    let currentTimestamp = Date.now() / 1000 | 0
    return setter(storage, key, { value, timestamp: currentTimestamp })
  }

  async function load (key, ttl = Day) {
    let currentTimestamp = Date.now() / 1000 | 0
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
  async function applyWith (name, func, ttl, params) {

    let key = JSON.stringify([name, params])
    let box = await getter(storage, key)

    let currentTimestamp = Date.now() / 1000 | 0

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
  function wrapperWithCall (name, func, ttl) {
    return function (...params) {
      return applyWith(name, func, ttl, params)
    }
  }

  async function cleanUp(ttl = Day) {
    if (!opts.iterater || !opts.remover) {
      console.warn('create cache do not offer iterater and remover function')
      return false
    }
    await opts.iterater(storage, (v, k) => {
      if (!v || !v.value || !v.timestamp) {
        opts.remover(storage, k)
      }
      else {
        let currentTimestamp = Date.now() / 1000 | 0
        if (currentTimestamp - v.timestamp > ttl) {
          opts.remover(storage, k)
        }
      }
    })

    return true
  }

  return {
    applyWith, wrapperWithCall, cleanUp, save, load,
  }
}

module.exports = createCache
