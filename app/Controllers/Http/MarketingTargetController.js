"use strict"

const MarketingTarget = use("App/Models/MarketingTarget")
const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits } = use("App/Traits")
const fillable = ["code", "study_program_id", "description", "angkatan"]

/**
 * MarketingTargetController
 *
 */

class MarketingTargetController {
  /**
   * Index
   * Get List of MarketingTargets
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `MarketingTarget_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        return cached
      }

      const data = await MarketingTarget.query()
        .with("study.studyName")
        .with("study.university")
        .where(function() {
          if (q.search && q.search != "") {
            this.where("code", "like", `%${q.search}%`)
            this.orWhere("angkatan", "like", `%${q.search}%`)
            this.orWhereHas("study", builder => {
              builder.whereHas("university", builder2 => {
                builder2.where("name", "like", `%${q.search}%`)
              })
            })
            this.orWhereHas("study", builder => {
              builder.orWhereHas("studyName", builder2 => {
                builder2.where("name", "like", `%${q.search}%`)
              })
            })
          }

          if (q.study_id && q.study_id != "") {
            return this.where("study_program_id", parseInt(q.study_id))
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
   * Store New MarketingTargets
   * Can only be done by Super Administrator
   */
  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const data = await MarketingTarget.create(body)
      await data.loadMany(["study.studyName", "study.university"])
      await RedisHelper.delete("MarketingTarget_*")
      await RedisHelper.delete("contacts*")
      await RedisHelper.delete("schedulles*")
      await RedisHelper.delete("downpayments*")
      const activity = `Add new MarketingTarget '${data.code}'`
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
   * MarketingTarget by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `MarketingTarget_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await MarketingTarget.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.loadMany(["study.studyName", "study.university"])
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
   * Update MarketingTarget by Id
   * Can only be done by Super Administrator
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await MarketingTarget.find(id)
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.merge(body)
      await data.save()
      await data.loadMany(["study.studyName", "study.university"])
      const activity = `Update MarketingTarget '${data.code}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("MarketingTarget_*")
      await RedisHelper.delete("contacts*")
      await RedisHelper.delete("schedulles*")
      await RedisHelper.delete("downpayments*")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete MarketingTarget by Id
   * Can only be done by Super Administrator
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await MarketingTarget.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.loadMany(["contacts", "schedulles", "downpayments"])
      const dataJSON = data.toJSON()
      if (dataJSON.contacts && dataJSON.contacts.length > 0) {
        return response
          .status(400)
          .send(
            ResponseParser.errorResponse(
              "This Marketing Target cannot be deleted since it has Contacts attached"
            )
          )
      }

      if (dataJSON.schedulles && dataJSON.schedulles.length > 0) {
        return response
          .status(400)
          .send(
            ResponseParser.errorResponse(
              "This Marketing Target cannot be deleted since it has Schedulles attached"
            )
          )
      }

      if (dataJSON.downpayments && dataJSON.downpayments.length > 0) {
        return response
          .status(400)
          .send(
            ResponseParser.errorResponse(
              "This Marketing Target cannot be deleted since it has Downpayments attached"
            )
          )
      }

      const activity = `Delete MarketingTarget '${data.code}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("MarketingTarget_*")
      await RedisHelper.delete("contacts*")
      await RedisHelper.delete("schedulles*")
      await RedisHelper.delete("downpayments*")
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Check if code is exists
   */
  async checkCode({ request, response }) {
    const { code } = request.params
    const target = await MarketingTarget.findBy("code", code)
    if (!target) {
      return response
        .status(400)
        .send(ResponseParser.errorResponse("Kode tidak valid"))
    }
    await target.loadMany(["study.university", "study.studyName"])
    return response.status(200).send(ResponseParser.apiItem(target))
  }
}

module.exports = MarketingTargetController
