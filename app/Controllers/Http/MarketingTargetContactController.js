"use strict"

const MarketingTargetContact = use("App/Models/MarketingTargetContact")
const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits } = use("App/Traits")
const fillable = ["marketing_target_id", "name", "title", "phone", "email"]

/**
 * MarketingTargetContactController
 *
 */

class MarketingTargetContactController {
  /**
   * Index
   * Get List of MarketingTargetContacts
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `MarketingTargetContact_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        return cached
      }

      const data = await MarketingTargetContact.query()
        .with("target.study.university")
        .with("target.study.studyName")

        .where(function() {
          if (q.search && q.search != "") {
            this.where("name", "like", `%${q.search}%`)
            this.orWhere("title", "like", `%${q.search}%`)
            this.orWhere("phone", "like", `%${q.search}%`)
            this.orWhere("email", "like", `%${q.search}%`)
            this.orWhereHas("target", builder => {
              builder.where("code", "like", `%${q.search}%`)
            })
            this.orWhereHas("target", builder => {
              builder.whereHas("study", builder3 => {
                builder3.whereHas("university", builder4 => {
                  builder4.where("name", "like", `%${q.search}%`)
                })
              })
            })
            this.orWhereHas("target", builder => {
              builder.whereHas("study", builder3 => {
                builder3.whereHas("studyName", builder4 => {
                  builder4.where("name", "like", `%${q.search}%`)
                })
              })
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
   * Store New MarketingTargetContacts
   * Can only be done by Super Administrator
   */
  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const data = await MarketingTargetContact.create(body)
      await data.load("target")
      await RedisHelper.delete("MarketingTargetContact_*")
      const activity = `Add new MarketingTargetContact '${data.name}'`
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
   * MarketingTargetContact by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `MarketingTargetContact_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await MarketingTargetContact.find(id)
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
   * Update MarketingTargetContact by Id
   * Can only be done by Super Administrator
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await MarketingTargetContact.find(id)
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.merge(body)
      await data.save()
      await data.load("target")
      const activity = `Update MarketingTargetContact '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("MarketingTargetContact_*")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete MarketingTargetContact by Id
   * Can only be done by Super Administrator
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await MarketingTargetContact.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      const activity = `Delete MarketingTargetContact '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("MarketingTargetContact_*")
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = MarketingTargetContactController
