"use strict"

const ErrorLog = use("App/Models/ErrorLog")
const { RedisHelper, ResponseParser, GetRequestQuery } = use("App/Helpers")
const fillable = [
  "url",
  "method",
  "error",
  "solve_by",
  "soleved_at",
  "action_to_solve",
]

class ErrorLogController {
  /**
   * Index
   * Get List of Universities
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `ErrorLog_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        console.log(redisKey)
        return cached
      }

      const data = await ErrorLog.query()
        .where(function() {
          if (q.search && q.search != "") {
            this.where("from", "like", `%${q.search}%`)
            this.orWhere("resource", "like", `%${q.search}%`)
            this.orWhere("action", "like", `%${q.search}%`)
          }

          if (q.search_by && q.search_query) {
            this.where(q.search_by, q.search_query)
          }

          if (q.between_date && q.start_date && q.end_date) {
            this.whereBetween(q.between_date, [q.start_date, q.end_date])
          }
        })
        .orderBy(q.sort_by, q.sort_mode)
        .paginate(q.page, q.limit)

      let parsed = ResponseParser.apiCollection(data.toJSON())

      if (!q.search || q.search == "") {
        await RedisHelper.set(redisKey, parsed)
      }
      return response.status(200).send(parsed)
    } catch (e) {
      console.log("e", e)
    }
  }

  /**
   * Store
   * Store New ErrorLogs
   * Can only be done by Super Administrator
   */

  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const data = await ErrorLog.create(body)
      await RedisHelper.delete("ErrorLog_*")
      let parsed = ResponseParser.apiCreated(data.toJSON())
      return response.status(201).send(parsed)
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * Show
   * ErrorLog by id
   */
  async show({ request, response }) {
    const id = request.params.id
    let redisKey = `ErrorLog_${id}`
    let cached = await RedisHelper.get(redisKey)
    if (cached) {
      return response.status(200).send(cached)
    }
    const data = await ErrorLog.find(id)
    if (!data) {
      return response.status(400).send(ResponseParser.apiNotFound())
    }
    let parsed = ResponseParser.apiItem(data.toJSON())
    await RedisHelper.set(redisKey, parsed)
    return response.status(200).send(parsed)
  }

  /**
   * Update
   * Update ErrorLog by Id
   * Can only be done by Super Administrator
   */
  async update({ request, response, auth }) {
    let body = request.only(fillable)
    const id = request.params.id
    const data = await ErrorLog.find(id)
    if (!data || data.length === 0) {
      return response.status(400).send(ResponseParser.apiNotFound())
    }
    await data.merge(body)
    await data.save()
    await RedisHelper.delete("ErrorLog_*")
    let parsed = ResponseParser.apiUpdated(data.toJSON())
    return response.status(200).send(parsed)
  }

  /**
   * Delete
   * Delete ErrorLog by Id
   */
  async destroy({ request, response, auth }) {
    const id = request.params.id
    const data = await ErrorLog.find(id)
    if (!data) {
      return response.status(400).send(ResponseParser.apiNotFound())
    }

    await RedisHelper.delete("ErrorLog_*")
    await data.delete()
    return response.status(200).send(ResponseParser.apiDeleted())
  }
}

module.exports = ErrorLogController
