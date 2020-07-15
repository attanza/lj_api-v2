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
  "password",
  "phone",
  "address",
  "description",
  "is_active",
]

class SupervisorController {
  /**
   * Index
   * Get List of Supervisors
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `Supervisor_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        return cached
      }
      const data = await User.query()
        .whereHas("roles", builder => {
          builder.where("slug", "supervisor")
        })
        .where(function() {
          if (q.search && q.search != "") {
            this.where("name", "like", `%${q.search}%`)
            this.orWhere("email", "like", `%${q.search}%`)
            this.orWhere("phone", "like", `%${q.search}%`)
            this.orWhere("address", "like", `%${q.search}%`)
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
   * Create New Supervisor
   */

  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const data = await User.create(body)
      await data.roles().attach(await getSupervisorRoleId())
      await ActivationTraits.createAndActivate(data)
      await RedisHelper.delete("Supervisor_*")
      await RedisHelper.delete("User_*")
      const activity = `Add new Supervisor '${data.name}'`
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
   * Get Supervisor by ID
   */

  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `Supervisor_${id}`
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
   * Update Supervisor data by ID
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
      const activity = `Update Supervisor '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("Supervisor_*")
      await RedisHelper.delete("User_*")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete Supervisor data by ID
   */

  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await User.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }

      const activity = `Delete Supervisor '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("Supervisor_*")
      await RedisHelper.delete("Marketing_*")
      await RedisHelper.delete("User_*")
      // Delete Relationship
      await data.tokens().delete()
      await data.marketings().detach()
      await data.roles().detach()
      // Delete Data
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Attaching Marketings to Supervisor
   */

  async attachMarketing({ request, response, auth }) {
    try {
      const { supervisor_id, marketings } = request.only([
        "supervisor_id",
        "marketings",
      ])
      // Check if Supervisor exist
      const supervisor = await User.find(supervisor_id)
      if (!supervisor) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      // Check Marketings
      let filteredMarketings = []
      for (let i = 0; i < marketings.length; i++) {
        let marketing = await User.query()
          .whereHas("roles", builder => {
            builder.where("role_id", 4)
          })
          .where("id", marketings[i])
          .first()
        if (marketing) filteredMarketings.push(marketing.id)
      }
      await supervisor.marketings().sync(filteredMarketings)
      const activity = "Attaching Marktings to Supervisor"
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("User_*")
      await RedisHelper.delete("Supervisor_*")
      await RedisHelper.delete("Marketing_*")
      return response
        .status(200)
        .send(ResponseParser.successResponse(null, "Marketing attached"))
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async detachMarketing({ request, response, auth }) {
    try {
      const { supervisor_id, marketings } = request.only([
        "supervisor_id",
        "marketings",
      ])
      const supervisor = await User.find(supervisor_id)
      if (!supervisor) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await supervisor.marketings().detach(marketings)
      await supervisor.load("marketings")
      const activity = "Detach Marketings from Supervisor"
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("User_*")
      await RedisHelper.delete("Supervisor_*")
      await RedisHelper.delete("Marketing_*")
      return response
        .status(200)
        .send(ResponseParser.successResponse(supervisor, "Marketing detached"))
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = SupervisorController

async function getSupervisorRoleId() {
  let redisKey = "SupervisorId"
  let cached = await RedisHelper.get(redisKey)
  if (cached) {
    return cached
  }
  let supervisorRole = await Role.findBy("slug", "supervisor")
  await RedisHelper.set(redisKey, supervisorRole.id)
  return supervisorRole.id
}
