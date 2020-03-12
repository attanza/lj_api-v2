"use strict"

const axios = require("axios")
const Env = use("Env")
const { parseMicroApiQuery, ErrorLog, RedisHelper } = use("App/Helpers")

class ActivityTraits {
  constructor() {
    axios.defaults.baseURL = Env.get("REFERRAL_API")
  }

  async all(query) {
    const resp = await axios
      .get("/activities" + parseMicroApiQuery(query))
      .then(res => res.data)
    return resp
  }

  async saveActivity(request, auth, activity) {
    const NODE_ENV = Env.get("NODE_ENV")
    // if (NODE_ENV === "production") {
    try {
      const headers = request.headers()
      const user = await auth.getUser()

      const activityData = {
        user: {
          id: user.id.toString(),
          email: user.email,
        },
        browser: headers["user-agent"],
        activity,
        ip: request.ip(),
      }

      await axios.post("/activities", activityData)
      RedisHelper.delete("Activity_*")

      return true
    } catch (e) {
      console.log(JSON.stringify(e))
      ErrorLog(request, e)
    }
    // }
  }
}

module.exports = new ActivityTraits()
