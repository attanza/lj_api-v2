"use strict"

const Schedulle = use("App/Models/Schedulle")
const {
  RedisHelper,
  ResponseParser,
  PushNotifications,
  ErrorLog,
  GetRequestQuery,
} = use("App/Helpers")
const { ActivityTraits } = use("App/Traits")

const fillable = [
  "code",
  "marketing_id",
  "marketing_target_id",
  "marketing_action_id",
  "date",
  "description",
]

class SchedulleController {
  /**
   * Index
   * Get List of Schedulle
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `Schedulle_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        console.log(redisKey)
        return cached
      }

      const data = await Schedulle.query()
        .with("target.study.studyName")
        .with("target.study.university")
        .with("action", builder => {
          builder.select("id", "name")
        })
        .with("report", builder => {
          builder.select("id", "code")
        })
        .with("marketing", builder => {
          builder.select("id", "name")
        })
        .where(function() {
          if (q.search && q.search != "") {
            this.where("code", "like", `%${q.search}%`)
            this.orWhere("description", "like", `%${q.search}%`)
            this.orWhere("date", "like", `%${q.search}%`)
            this.orWhereHas("action", builder => {
              builder.where("name", "like", `%${q.search}%`)
            })
            this.orWhereHas("target", builder => {
              builder.where("code", "like", `%${q.search}%`)
            })
            this.orWhereHas("report", builder => {
              builder.where("code", "like", `%${q.search}%`)
            })
            this.orWhereHas("marketing", builder => {
              builder.where("name", "like", `%${q.search}%`)
            })
          }

          if (q.marketing_id && q.marketing_id != "") {
            this.where("marketing_id", q.marketing_id)
          }

          if (q.marketing_target_id && q.marketing_target_id != "") {
            this.where("marketing_target_id", q.marketing_target_id)
          }

          if (q.marketing_action_id && q.marketing_action_id != "") {
            this.where("marketing_action_id", q.marketing_action_id)
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
   * Store New Schedulle
   */
  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      if (!body.code || body.code == "") {
        body.code = Math.floor(Date.now() / 1000).toString()
      }
      const data = await Schedulle.create(body)
      await data.loadMany(["marketing", "target", "action"])
      await RedisHelper.delete("Schedulle_*")
      const activity = `Add new Schedulle '${data.code}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      let parsed = ResponseParser.apiCreated(data.toJSON())
      if (parsed.data.marketing && parsed.data.marketing.uid) {
        const { uid } = parsed.data.marketing
        let fcmData = { to: uid }
        await PushNotifications.sendToMobile("newSchedulle", fcmData)
      }
      return response.status(201).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Show
   * Schedulle by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `Schedulle_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await Schedulle.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.loadMany([
        "marketing",
        "target.study.studyName",
        "target.study.university",
        "action",
      ])
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
   * Update Schedulle by Id
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await Schedulle.find(id)
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.merge(body)
      await data.save()
      const activity = `Update Schedulle '${data.code}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("Schedulle_*")
      await data.loadMany([
        "marketing",
        "target.study.studyName",
        "target.study.university",
        "action",
      ])
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete Schedulle by Id
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await Schedulle.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      // Check Relationship
      await data.load("report")
      let dataJSON = data.toJSON()

      if (dataJSON.schedulle && dataJSON.schedulle.length > 0) {
        return response
          .status(400)
          .send(
            ResponseParser.errorResponse(
              "This Schedulle cannot be deleted since it has Reports attached"
            )
          )
      }
      const activity = `Delete Schedulle '${data.code}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("Schedulle*")
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = SchedulleController
