"use strict"

const axios = require("axios")
const Env = use("Env")
const { parseMicroApiQuery, RedisHelper } = use("App/Helpers")

class ReferralTrait {
  constructor() {
    axios.defaults.baseURL = Env.get("REFERRAL_API")
  }
  async all(query) {
    const { redisKey } = query
    const cache = await RedisHelper.get(redisKey)
    if (cache && cache != null) {
      return cache
    }
    const resp = await axios
      .get("referrals" + parseMicroApiQuery(query))
      .then(res => res.data)
    if (!query.search || query.search === "") {
      RedisHelper.set(redisKey, resp)
    }
    return resp
  }

  async store(data) {
    const resp = await axios.post("referrals", data).then(res => res.data)
    RedisHelper.delete("Referral_*")
    return resp
  }

  async show(id) {
    const redisKey = `Referral_${id}`
    const cache = await RedisHelper.get(redisKey)
    if (cache && cache != null) {
      return cache
    }
    const resp = await axios.get("referrals/" + id).then(res => res.data)
    RedisHelper.set(redisKey, resp)
    return resp
  }

  async update(id, data) {
    const resp = await axios.put("referrals/" + id, data).then(res => res.data)
    RedisHelper.delete("Referral_*")

    return resp
  }

  async destroy(id) {
    const resp = await axios.delete("referrals/" + id).then(res => res.data)
    RedisHelper.delete("Referral_*")
    return resp
  }

  async check(code) {
    const resp = await axios
      .get(`/referrals/${code}/check`)
      .then(res => res.data)
    return resp
  }
}

module.exports = new ReferralTrait()
