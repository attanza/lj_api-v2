"use strict"

const Permission = use("App/Models/Permission")
const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits } = use("App/Traits")
const fillable = ["name", "description"]

/**
 * PermissionController
 *
 */

class PermissionController {
  /**
   * Index
   * Get List of Permissions
   */
  async index(ctx) {
    const { request, response } = ctx
    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `Permission_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        console.log(redisKey)
        return cached
      }

      const data = await Permission.query()
        .where(function() {
          if (q.search && q.search != "") {
            this.where("name", "like", `%${q.search}%`)
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
   * Store New Permissions
   * Can only be done by Super Administrator
   */
  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const data = await Permission.create(body)
      await RedisHelper.delete("Permission_*")
      const activity = `Add new Permission '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      let parsed = ResponseParser.apiCreated(data.toJSON())
      return response.status(201).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async bulkStore({ request, response, auth }) {
    try {
      let { permissions } = request.post()
      const permissionData = []

      const permissionIds = await Permission.query()
        .whereIn("name", permissions)
        .pluck("id")

      if (permissionIds && permissionIds.length > 0) {
        return response
          .status(422)
          .send(
            ResponseParser.apiValidationFailed(
              null,
              "One or more permissions is already exists"
            )
          )
      }
      permissions.map(p => permissionData.push({ name: p }))
      const data = await Permission.createMany(permissionData)
      await RedisHelper.delete("Permission_*")
      const activity = `Add new Bulk Permission'`
      await ActivityTraits.saveActivity(request, auth, activity)
      let parsed = ResponseParser.apiCreated()
      return response.status(201).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Show
   * Permission by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `Permission_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await Permission.find(id)
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
   * Update Permission by Id
   * Can only be done by Super Administrator
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await Permission.find(id)
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.merge(body)
      await data.save()
      const activity = `Update Permission '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("Permission_*")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete Permission by Id
   * Can only be done by Super Administrator
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await Permission.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }

      await data.roles().detach()

      const activity = `Delete Permission '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("Permission_*")
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = PermissionController
