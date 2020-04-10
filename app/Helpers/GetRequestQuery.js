"use strict"

module.exports = async ctx => {
  const { request, auth, role, key } = ctx
  let query = request.get()
  query.page = parseInt(query.page) || 1
  query.limit = parseInt(query.limit) || 10
  if (!query.sort_by) query.sort_by = "id"
  if (!query.sort_mode) query.sort_mode = "desc"

  if (role && key) {
    const user = await auth.getUser()
    const userRoles = await user.getRoles()
    if (userRoles.includes(role)) {
      query.search_by = key
      query.search_query = user.id
    }
  }

  const redisKey = Object.values(query).join("")
  query.redisKey = redisKey
  return query
}
