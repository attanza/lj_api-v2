"use strict"

const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits } = use("App/Traits")

class ActivityController {
  /**
   * Index
   * Get List of Activities
   */
  async index({ request, response }) {
    try {
      const query = await GetRequestQuery({request})
      const redisKey = "Activity" + query.redisKey
      let cached = await RedisHelper.get(redisKey)
      if (cached && !query.search) {
        return cached
      }

      const data = await ActivityTraits.all(query)
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
}

module.exports = ActivityController
