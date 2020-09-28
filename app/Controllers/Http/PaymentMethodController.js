"use strict"

const PaymentMethod = use("App/Models/PaymentMethod")
const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits } = use("App/Traits")
const fillable = ["name", "is_active"]

/**
 * PaymentMethodController
 *
 */

class PaymentMethodController {
  /**
   * Index
   * Get List of PaymentMethods
   */
  async index(ctx) {
    const { request, response } = ctx
    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `PaymentMethod_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        return cached
      }

      const data = await PaymentMethod.query()
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

  async listForMobile({ request, response }) {
    try {
      const redisKey = `PaymentMethod_Mobile}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return cached
      }
      const data = await PaymentMethod.query()
        .select("name", "is_active")
        .fetch()
      const parsed = ResponseParser.apiItem(data.toJSON())
      await RedisHelper.set(redisKey, parsed)
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
  /**
   * Store
   * Store New PaymentMethods
   * Can only be done by Super Administrator
   */
  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const data = await PaymentMethod.create(body)
      await RedisHelper.delete("PaymentMethod_*")
      const activity = `Add new PaymentMethod '${data.name}'`
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
   * PaymentMethod by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `PaymentMethod_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await PaymentMethod.find(id)
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
   * Update PaymentMethod by Id
   * Can only be done by Super Administrator
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await PaymentMethod.find(id)
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.merge(body)
      await data.save()
      const activity = `Update PaymentMethod '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("PaymentMethod_*")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete PaymentMethod by Id
   * Can only be done by Super Administrator
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await PaymentMethod.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }

      const activity = `Delete PaymentMethod '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("PaymentMethod_*")
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      console.log("e", e)

      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = PaymentMethodController
