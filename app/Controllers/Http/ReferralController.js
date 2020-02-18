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
      const data = await ReferralTrait.all(query)
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
      const { id } = request.params
      const data = await ReferralTrait.show(id)
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

      ActivityTraits.saveActivity(request, auth, activity)

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

      ActivityTraits.saveActivity(request, auth, activity)

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

      ActivityTraits.saveActivity(request, auth, activity)

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
