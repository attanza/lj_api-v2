"use strict"

const TargetYear = use("App/Models/TargetYear")
const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits } = use("App/Traits")
const fillable = [
  "year",
  "class",
  "students",
  "marketing_target_id",
  "count_attendence",
  "people_dp",
  "count_dp",
  "count_add",
  "count_cancel",
  "count_packages",
]

/**
 * TargetYearController
 *
 */

class TargetYearController {
  /**
   * Index
   * Get List of TargetYears
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `TargetYear_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        return cached
      }

      const data = await TargetYear.query()
        .with("target")
        .where(function() {
          if (q.search && q.search != "") {
            this.where("year", "like", `%${q.search}%`)
            this.orWhere("class", "like", `%${q.search}%`)
            this.orWhere("students", "like", `%${q.search}%`)
            this.orWhereHas("target", builder => {
              builder.where("code", "like", `%${q.search}%`)
            })
          }

          if (q.marketing_target_id && q.marketing_target_id != "") {
            this.where("marketing_target_id", q.marketing_target_id)
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
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Store
   * Store New TargetYears
   * Can only be done by Super Administrator
   */
  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const data = await TargetYear.create(body)
      await RedisHelper.delete("TargetYear_*")
      const activity = `Add new TargetYear '${data.year}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      let parsed = ResponseParser.apiCreated(data.toJSON())
      return response.status(201).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Show
   * TargetYear by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `TargetYear_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await TargetYear.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.load("target")
      let parsed = ResponseParser.apiItem(data.toJSON())
      await RedisHelper.set(redisKey, parsed)
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Update
   * Update TargetYear by Id
   * Can only be done by Super Administrator
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await TargetYear.find(id)
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.merge(body)
      await data.save()
      await data.load("target")
      const activity = `Update TargetYear '${data.year}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("TargetYear_*")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete TargetYear by Id
   * Can only be done by Super Administrator
   * Default TargetYear ['Super Administrator', 'Administrator', 'Supervisor', 'Marketing', 'Student'] cannot be deleted
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await TargetYear.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      const activity = `Delete TargetYear '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("TargetYear_*")
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = TargetYearController
