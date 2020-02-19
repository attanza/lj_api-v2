'use strict'

const { test } = use('Test/Suite')('Order Test')

test('make sure 2 + 2 is 4', async ({ assert }) => {
  assert.equal(2 + 2, 4)
})
