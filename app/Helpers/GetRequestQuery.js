"use strict"

module.exports = request => {
  let query = request.get()
  if (!query.page) query.page = 1
  if (!query.limit) query.limit = 10
  if (!query.sort_by) query.sort_by = "id"
  if (!query.sort_mode) query.sort_mode = "desc"

  const redisKey = Object.values(query).join("")
  query.redisKey = redisKey
  return query
}
