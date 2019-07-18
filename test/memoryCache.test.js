const { memoryCache } = require('../memoryCache')

function sleep(n) {
  return new Promise(resolve => setTimeout(resolve, n))
}

test('test save', async () => {
  let value = await memoryCache.save('a', 1)
  expect(value).toHaveProperty('value')
  expect(value).toHaveProperty('timestamp')
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