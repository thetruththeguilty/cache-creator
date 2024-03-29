import createCache, { ICache } from './index'

export class MemoryStorage {

  dict: any = {}
  queue: any[] = []
  maxCount: number

  constructor(maxCount = 200) {
    this.maxCount = maxCount
  }

  getItem(key: string) { return this.dict[key] }

  setItem(key: string, value: any) {

    if (this.queue.length > this.maxCount) {
      let deleteKey = this.queue.shift()
      delete this.dict[deleteKey]
    }

    this.dict[key] = value
    return value
  }
}

export function createMemoryCache<TValue>(maxCount: number, nextLevel?: ICache<TValue>) {
  return createCache<MemoryStorage, TValue>(
    new MemoryStorage(maxCount),
    {
      getter: async (storage, key) => storage.getItem(key),
      setter: async (storage, key, value) => storage.setItem(key, value),
      nextLevel: nextLevel,
    }
  )
}

export let memoryCache = createMemoryCache(500)