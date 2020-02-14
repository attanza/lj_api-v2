"use strict"

const { ReferralTrait } = use("App/Traits")
const { GetRequestQuery, ResponseParser, RedisHelper, ErrorLog } = use(
  "App/Helpers"
)
const moment = require("moment")
const { ActivityTraits } = use("App/Traits")

class ReferralController {
  async index({ request, response }) {
    try {
      const query = GetRequestQuery(request)
      const redisKey = "Referral" + query.redisKey
      let cached = await RedisHelper.get(redisKey)
      if (cached && !query.search) {
        return cached
      }

      const data = await ReferralTrait.all(query)
      if (!query.search || query.search == "") {
        await RedisHelper.set(redisKey, data)
      }
      return data
    } catch (e) {
      ErrorLog(request, e)
      if (e.response && e.response.data) {
        return response
          .status(e.response.data.meta.status)
          .send(ResponseParser.errorResponse(e.response.data.meta.message))
      }
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async show({ request, response }) {
    try {
      const data = await this._getById(request, response)
      return response.status(200).send(data)
    } catch (e) {
      ErrorLog(request, e)
      if (e.response && e.response.data) {
        return response
          .status(e.response.data.meta.status)
          .send(ResponseParser.errorResponse(e.response.data.meta.message))
      }
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async store({ request, response, auth }) {
    try {
      const body = request.post()
      const user = await auth.getUser()
      const creator = {
        id: user.id,
        email: user.email,
      }
      body.creator = creator

      body.maxConsumer = 0
      body.validUntil = moment().add(1, "d")

      const data = await ReferralTrait.store(body)
      const activity = `Add new Referral '${data.code}'`
      Promise.all([
        RedisHelper.delete("Referral_*"),
        ActivityTraits.saveActivity(request, auth, activity),
      ])

      return response.status(201).send(data)
    } catch (e) {
      ErrorLog(request, e)
      if (e.response && e.response.data) {
        return response
          .status(e.response.data.meta.status)
          .send(ResponseParser.errorResponse(e.response.data.meta.message))
      }
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async update({ request, response, auth }) {
    try {
      const id = request.params.id
      const body = request.post()
      const data = await ReferralTrait.update(id, body)

      const activity = `Update Referral '${data.code}'`
      Promise.all([
        RedisHelper.delete("Referral_*"),
        ActivityTraits.saveActivity(request, auth, activity),
      ])

      return data
    } catch (e) {
      ErrorLog(request, e)
      if (e.response && e.response.data) {
        return response
          .status(e.response.data.meta.status)
          .send(ResponseParser.errorResponse(e.response.data.meta.message))
      }
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await ReferralTrait.destroy(id)

      const activity = `Delete Referral '${data.code}'`
      Promise.all([
        RedisHelper.delete("Referral_*"),
        ActivityTraits.saveActivity(request, auth, activity),
      ])

      return data
    } catch (e) {
      ErrorLog(request, e)
      if (e.response && e.response.data) {
        return response
          .status(e.response.data.meta.status)
          .send(ResponseParser.errorResponse(e.response.data.meta.message))
      }
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async _getById(request, response) {
    const id = request.params.id
    let redisKey = `Referral_${id}`
    let cached = await RedisHelper.get(redisKey)
    if (cached) {
      return cached
    }
    const data = await ReferralTrait.show(id)
    if (!data) {
      return response.status(400).send(ResponseParser.apiNotFound())
    }
    await RedisHelper.set(redisKey, data)
    return data
  }
}

module.exports = ReferralController
