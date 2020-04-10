"use strict"

const { ReferralTrait } = use("App/Traits")
const { GetRequestQuery, ResponseParser, ErrorLog, RedisHelper } = use(
  "App/Helpers"
)
const moment = require("moment")
const { ActivityTraits } = use("App/Traits")
const randomstring = require("randomstring")

class ReferralController {
  async index({ request, response, auth }) {
    try {
      const query = await GetRequestQuery({
        request,
        auth,
        role: "marketing",
        key: "creator.id",
      })
      const { redisKey } = query
      const cache = await RedisHelper.get(`Referral_${redisKey}`)
      if (cache && cache != null) {
        console.log("get referral from cache")
        return cache
      }
      const data = await ReferralTrait.all(query)
      if (!query.search || query.search === "") {
        RedisHelper.set(`Referral_${redisKey}`, data)
      }
      return data
    } catch (e) {
      console.log("e", e)
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
      const { id } = request.params
      const redisKey = `Referral_${id}`
      const cache = await RedisHelper.get(redisKey)
      if (cache && cache != null) {
        return cache
      }
      const data = await ReferralTrait.show(id)
      RedisHelper.set(redisKey, data)
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
      if (!body.code) {
        body.code =
          user.name.substr(0, 3).toUpperCase() +
          randomstring.generate({
            length: 7,
            charset: "alphanumeric",
            capitalization: "lowercase",
          })
      }
      const creator = {
        id: user.id,
        email: user.email,
      }
      body.creator = creator
      body.maxConsumer = 0
      if (!body.validUntil) {
        body.validUntil = moment().add(1, "d")
      }
      const data = await ReferralTrait.store(body)
      const activity = `Add new Referral '${data.data.code}'`

      Promise.all([
        ActivityTraits.saveActivity(request, auth, activity),
        RedisHelper.delete("Referral_*"),
      ])
      return response.status(201).send(data)
    } catch (e) {
      console.log("e", e)
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

      const activity = `Update Referral '${data.data.code}'`

      Promise.all([
        ActivityTraits.saveActivity(request, auth, activity),
        RedisHelper.delete("Referral_*"),
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

      const activity = `Delete Referral '${id}'`

      Promise.all([
        ActivityTraits.saveActivity(request, auth, activity),
        RedisHelper.delete("Referral_*"),
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
}

module.exports = ReferralController
