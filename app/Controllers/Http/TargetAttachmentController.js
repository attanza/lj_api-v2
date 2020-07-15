"use strict"

const TargetAttachment = use("App/Models/TargetAttachment")
const MarketingTarget = use("App/Models/MarketingTarget")
const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits } = use("App/Traits")
const Helpers = use("Helpers")
const Drive = use("Drive")
const fillable = ["marketing_target_id", "caption", "tags"]

/**
 * TargetAttachmentController
 *
 */

class TargetAttachmentController {
  /**
   * Index
   * Get List of TargetAttachments
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `TargetAttachment_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        return cached
      }

      const data = await TargetAttachment.query()
        .with("target")
        .where(function() {
          if (q.search && q.search != "") {
            this.where("url", "like", `%${q.search}%`)
            this.orWhere("caption", "like", `%${q.search}%`)
            this.orWhere("tags", "like", `%${q.search}%`)
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
   * Store New TargetAttachments
   * Can only be done by Super Administrator
   */
  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)

      // Check if marketing report exist
      const target = await MarketingTarget.find(
        parseInt(body.marketing_target_id)
      )
      if (!target) {
        return response
          .status(400)
          .send(ResponseParser.errorResponse("Marketing Target not found"))
      }

      const docFile = request.file("file")

      if (!docFile) {
        return response
          .status(400)
          .send(ResponseParser.errorResponse("File to be uploaded is required"))
      }
      const name = `${body.marketing_target_id}_${new Date().getTime()}.${
        docFile.subtype
      }`

      await docFile.move(Helpers.publicPath("img/marketing_target"), { name })

      if (!docFile.moved()) {
        return response
          .status(400)
          .send(ResponseParser.errorResponse("file failed to upload"))
      }
      body.url = `/img/marketing_target/${name}`
      const data = await TargetAttachment.create(body)
      await data.load("target")
      await RedisHelper.delete("TargetAttachment_*")
      const activity = `Add new TargetAttachment <Target Code ${target.code}>`
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
   * TargetAttachment by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `TargetAttachment_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await TargetAttachment.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
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
   * Update TargetAttachment by Id
   * Can only be done by Super Administrator
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await TargetAttachment.find(id)
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      // Check if marketing target exist
      const target = await MarketingTarget.find(
        parseInt(body.marketing_target_id)
      )
      if (!target) {
        return response
          .status(400)
          .send(ResponseParser.errorResponse("Marketing Target not found"))
      }

      await data.merge(body)
      await data.save()
      await data.load("target")
      const activity = `Update TargetAttachment <Target Code ${target.code}>`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("TargetAttachment_*")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      let data = await TargetAttachment.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }

      let exists = await Drive.exists(Helpers.publicPath(data.url))
      if (exists) {
        await Drive.delete(Helpers.publicPath(data.url))
      }
      const activity = `Delete TargetAttachment ID <${id}>`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("TargetAttachment_*")
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = TargetAttachmentController
