"use strict"

module.exports = request => {
  let {
    page,
    limit,
    search,
    search_by,
    search_query,
    between_date,
    start_date,
    end_date,
    sort_by,
    sort_mode,
  } = request.get()

  if (!page) page = 1
  if (!limit) limit = 10
  if (!sort_by) sort_by = "id"
  if (!sort_mode) sort_mode = "desc"

  const redisKey = `_${page}${limit}${sort_by}${sort_mode}${search_by ||
    ""}${search_query || ""}${between_date || ""}${start_date ||
    ""}${end_date || ""}`

  return {
    page,
    limit,
    search,
    search_by,
    search_query,
    between_date,
    start_date,
    end_date,
    sort_by,
    sort_mode,
    redisKey: redisKey.trim(),
  }
}
