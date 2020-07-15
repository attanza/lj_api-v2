"use strict"

const User = use("App/Models/User")
const Role = use("App/Models/Role")
const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits, ActivationTraits } = use("App/Traits")

const fillable = [
  "name",
  "email",
  "phone",
  "address",
  "description",
  "is_active",
]

/**
 * UserController
 *
 */

class UserController {
  /**
   * Index
   * Get List of Users
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `Marketing_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        return cached
      }

      const data = await User.query()
        .where(function() {
          if (q.search && q.search != "") {
            this.where("name", "like", `%${q.search}%`)
            this.orWhere("email", "like", `%${q.search}%`)
            this.orWhere("phone", "like", `%${q.search}%`)
          }

          if (q.supervisor_id && q.supervisor_id != "") {
            this.whereHas("supervisors", builder => {
              return builder.where("supervisor_id", q.supervisor_id)
            })
          }

          if (q.search_by && q.search_query) {
            this.where(q.search_by, q.search_query)
          }

          if (q.between_date && q.start_date && q.end_date) {
            this.whereBetween(q.between_date, [q.start_date, q.end_date])
          }
        })
        .whereHas("roles", builder => {
          return builder.where("slug", "marketing")
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
   * Create New Marketing
   */

  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      let { password } = request.post()
      body.password = password
      const data = await User.create(body)
      await data.roles().attach(await getMarketingRoleId())
      await ActivationTraits.createAndActivate(data)
      await RedisHelper.delete("Marketing_*")
      await RedisHelper.delete("User_*")
      await RedisHelper.delete("Dashboard_Data")
      await RedisHelper.delete("activities")
      const activity = `Add new Marketing '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await data.load("supervisors")
      let parsed = ResponseParser.apiCreated(data.toJSON())
      return response.status(201).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Show
   * Get Marketing by ID
   */

  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `Marketing_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await User.query()
        .where("id", id)
        .first()
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.load("supervisors")
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
   * Update Marketing data by ID
   */

  async update({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await User.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }

      let body = request.only(fillable)

      await data.merge(body)
      await data.save()
      await data.load("supervisors")
      const activity = `Update Marketing '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("Marketing_*")
      await RedisHelper.delete("User_*")
      await RedisHelper.delete("Dashboard_Data")
      await RedisHelper.delete("activities")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete Marketing data by ID
   */

  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await User.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      const activity = `Delete Marketing '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("Marketing_*")
      await RedisHelper.delete("User_*")
      await RedisHelper.delete("Dashboard_Data")
      await RedisHelper.delete("activities")
      // Delete Relationship
      await data.tokens().delete()
      await data.roles().detach()
      await data.supervisors().detach()
      // Delete Data
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

async function getMarketingRoleId() {
  let redisKey = "MerktingId"
  let cached = await RedisHelper.get(redisKey)
  if (cached) {
    return cached
  }
  let marketingRole = await Role.findBy("slug", "marketing")
  await RedisHelper.set(redisKey, marketingRole.id)
  return marketingRole.id
}

module.exports = UserController
