"use strict"

module.exports = query => {
  delete query["redisKey"]
  const queryConversion = {
    page: "page",
    limit: "limit",
    search: "search",
    search_by: "fieldKey",
    search_query: "fieldValue",
    between_date: "dateField",
    start_date: "dateStart",
    end_date: "dateEnd",
    sort_by: "sortBy",
    sort_mode: "sortMode",
    select: "select"
  }
  let queryString = "?"
  Object.keys(query).map(key => {
    if (query[key]) {
      queryString += `${queryConversion[key]}=${query[key]}&`
    }
  })
  return queryString
}
