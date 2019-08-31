## interface
```ts
export interface ICache<TValue> {
  applyWith: (name: string, func: Function, ttl: number, params: any[]) => Promise<TValue>,
  wrapperWithCall: (name: string, func: Function, ttl: number) => (...params: any[]) => Promise<TValue>,
  cleanUp: (ttl: number) => Promise<any>,
  save: (key: string, value: TValue, ttl?: number) => Promise<IValueWrapper<TValue>>,
  load: (key: string, ttl?: number) => Promise<TValue | undefined>,
  timeDivider: () => number
}
```

## use next-level cache
```js
  let l2 = createMemoryCache(500)
  let l1 = createMemoryCache(500, l2)

  await l2.save('l2', 1)
  expect((await l2.load('l2'))).toBe(1)
  expect((await l1.load('l2'))).toBe(1)

  await l1.save('l1', 2)
  expect((await l2.load('l1'))).toBe(2)
  expect((await l1.load('l1'))).toBe(2)

  expect((await l1.load('l3'))).toBeUndefined()
```