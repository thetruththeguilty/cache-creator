const { memoryCache, createMemoryCache } = require('../memoryCache')

function sleep(n) {
  return new Promise(resolve => setTimeout(resolve, n))
}

test('test save', async () => {
  let value = await memoryCache.save('a', 1)
  expect(value).toStrictEqual(

    expect.objectContaining({
      value: expect.anything(),
      timestamp: expect.any(Number)
    })
  )
  expect(value.value).toBe(1)
})

test('test load', async () => {
  await memoryCache.save('b', 1)
  let value = await memoryCache.load('b', 10)
  expect(value).toBe(1)
})

test('test load out of date', async () => {
  await memoryCache.save('c', 1)
  await sleep(2000)
  let value = await memoryCache.load('c', 1)
  expect(value).toBe(undefined)
})

test('test next level', async () => {
  let l2 = createMemoryCache(500)
  let l1 = createMemoryCache(500, l2)

  await l2.save('l2', 1)
  expect((await l2.load('l2'))).toBe(1)
  expect((await l1.load('l2'))).toBe(1)

  await l1.save('l1', 2)
  expect((await l2.load('l1'))).toBe(2)
  expect((await l1.load('l1'))).toBe(2)

  expect((await l1.load('l3'))).toBeUndefined()
})