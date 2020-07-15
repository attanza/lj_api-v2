"use strict"

const User = use("App/Models/User")
const Role = use("App/Models/Role")
const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits, ActivationTraits } = use("App/Traits")
const Hash = use("Hash")
const fillable = [
  "name",
  "email",
  "password",
  "phone",
  "address",
  "description",
  "is_active",
]

class UserController {
  /**
   * Index
   * Get List of Users
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `User_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        return cached
      }

      const data = await User.query()
        .with("roles")
        .where(function() {
          if (q.search && q.search != "") {
            this.where("name", "like", `%${q.search}%`)
            this.orWhere("email", "like", `%${q.search}%`)
            this.orWhere("phone", "like", `%${q.search}%`)
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
   * Create New User
   */

  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const data = await User.create(body)
      let { roles } = request.post()
      if (roles) {
        await this.attachRoles(data, roles)
      }
      await data.load("roles")
      await ActivationTraits.createAndActivate(data)
      await RedisHelper.delete("User_*")
      await RedisHelper.delete("Supervisor_*")
      await RedisHelper.delete("Marketing_*")
      const activity = `Add new User '${data.name}'`
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
   * Get User by ID
   */

  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `User_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }

      const data = await User.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.loadMany(["roles", "marketings", "supervisors"])
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
   * Update User data by ID
   */

  async update({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await User.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      let body = request.only(fillable)
      if (body.password) {
        const hashPassword = await Hash.make(body.password)
        body.password = hashPassword
      }
      await data.merge(body)
      await data.save()
      let { roles } = request.post()
      if (roles) {
        await this.attachRoles(data, roles)
      }
      await data.load("roles")
      const activity = `Update User '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("User_*")
      await RedisHelper.delete("Supervisor_*")
      await RedisHelper.delete("Marketing_*")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete User data by ID
   */

  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await User.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }

      const activity = `Delete User '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("User_*")
      await RedisHelper.delete("Supervisor_*")
      await RedisHelper.delete("Marketing_*")
      // Delete Relationship
      await data.tokens().delete()
      await data.supervisors().detach()
      await data.marketings().detach()
      await data.roles().detach()
      await data.activities().delete()
      // Delete Data
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Attach Users to User
   */

  async attachRoles(user, roles) {
    let confirmedRoles = []
    for (let i = 0; i < roles.length; i++) {
      let data = await Role.find(roles[i])
      if (data) confirmedRoles.push(data.id)
    }
    await user.roles().sync(confirmedRoles)
  }
}

module.exports = UserController
