"use strict"

const MarketingReport = use("App/Models/MarketingReport")
const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits } = use("App/Traits")
const fillable = [
  "code",
  "schedulle_id",
  "method",
  "date",
  "terms",
  "result",
  "note",
  "lat",
  "lng",
  "description",
]

/**
 * MarketingReportController
 *
 */

class MarketingReportController {
  /**
   * Index
   * Get List of MarketingReports
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `MarketingReport_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        console.log(redisKey)
        return cached
      }

      const data = await MarketingReport.query()
        .with("schedulle.marketing")
        .with("schedulle.target.study.university")
        .with("schedulle.target.study.studyName")
        .with("schedulle.action")
        .where(function() {
          if (q.search && q.search != "") {
            this.where("method", "like", `%${q.search}%`)
            this.orWhere("code", "like", `%${q.search}%`)
            this.orWhereHas("schedulle", builder => {
              builder.whereHas("action", builder2 => {
                builder2.where("name", "like", `%${q.search}%`)
              })
            })
            this.orWhereHas("schedulle", builder => {
              builder.orWhere("code", "like", `%${q.search}%`)
            })
            this.orWhereHas("schedulle", builder => {
              builder.whereHas("target", builder2 => {
                builder2.whereHas("study", builder3 => {
                  builder3.whereHas("university", builder4 => {
                    builder4.where("name", "like", `%${q.search}%`)
                  })
                })
              })
            })
            this.orWhereHas("schedulle", builder => {
              builder.whereHas("target", builder2 => {
                builder2.whereHas("study", builder3 => {
                  builder3.whereHas("studyName", builder4 => {
                    builder4.where("name", "like", `%${q.search}%`)
                  })
                })
              })
            })
          }

          if (q.search_by && q.search_query) {
            this.where(q.search_by, q.search_query)
          }

          if (q.between_date && q.start_date && q.end_date) {
            this.whereBetween(q.between_date, [q.start_date, q.end_date])
          }

          if (q.marketing_target_id && q.marketing_target_id != "") {
            return this.whereHas("schedulle", builder => {
              builder.where("marketing_target_id", q.marketing_target_id)
            })
          }

          if (q.schedulle_id && q.schedulle_id != "") {
            return this.where("schedulle_id", parseInt(q.schedulle_id))
          }

          if (q.university_id && q.university_id != "") {
            return this.whereHas("schedulle", builder => {
              builder.whereHas("target", builder2 => {
                builder2.whereHas("study", builder3 => {
                  builder3.whereHas("university", builder4 => {
                    builder4.where("id", q.university_id)
                  })
                })
              })
            })
          }
        })
        .orderBy(q.sort_by, q.sort_mode)
        .paginate(parseInt(q.page), parseInt(q.limit))

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
   * Store New MarketingReports
   * Can only be done by Super Administrator
   */
  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      if (!body.code || body.code == "") {
        body.code = Math.floor(Date.now() / 1000).toString()
      }
      if (!body.date || body.date == "") {
        body.date = Date.now()
      }
      const data = await MarketingReport.create(body)
      await data.loadMany([
        "schedulle.marketing",
        "schedulle.action",
        "schedulle.target.study.studyName",
        "schedulle.target.study.university",
      ])

      await RedisHelper.delete("MarketingReport_*")
      const activity = `Add new MarketingReport '${data.code}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      let parsed = ResponseParser.apiCreated(data.toJSON())
      return response.status(201).send(parsed)
    } catch (e) {
      console.log("Error store marketing report : " + e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Show
   * MarketingReport by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `MarketingReport_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await MarketingReport.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.loadMany([
        "schedulle.marketing",
        "schedulle.action",
        "schedulle.target.study.studyName",
        "schedulle.target.study.university",
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
   * Update MarketingReport by Id
   * Can only be done by Super Administrator
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await MarketingReport.find(id)
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.merge(body)
      await data.save()
      await data.loadMany([
        "schedulle.marketing",
        "schedulle.action",
        "schedulle.target.study.studyName",
        "schedulle.target.study.university",
      ])
      const activity = `Update MarketingReport '${data.code}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("MarketingReport_*")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete MarketingReport by Id
   * Can only be done by Super Administrator
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await MarketingReport.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      const activity = `Delete MarketingReport '${data.code}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("MarketingReport_*")
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = MarketingReportController
