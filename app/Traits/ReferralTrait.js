"use strict"

const axios = require("axios")
const Env = use("Env")
const { parseMicroApiQuery, RedisHelper } = use("App/Helpers")
const REFERRAL_URL = Env.get("REFERRAL_API") + "/referrals"
class ReferralTrait {
  async all(query) {
    const resp = await axios
      .get(REFERRAL_URL + parseMicroApiQuery(query))
      .then(res => res.data)

    return resp
  }

  async store(data) {
    const resp = await axios.post(REFERRAL_URL, data).then(res => res.data)
    RedisHelper.delete("Referral_*")
    return resp
  }

  async show(id) {
    const resp = await axios.get(`${REFERRAL_URL}/${id}`).then(res => res.data)
    return resp
  }

  async update(id, data) {
    const resp = await axios
      .put(`${REFERRAL_URL}/${id}`, data)
      .then(res => res.data)
    RedisHelper.delete("Referral_*")

    return resp
  }

  async destroy(id) {
    const resp = await axios
      .delete(`${REFERRAL_URL}/${id}`)
      .then(res => res.data)
    RedisHelper.delete("Referral_*")
    return resp
  }

  /**
   * Check if referral code is exists
   * @param {string} code
   * @returns boolean
   */
  async check(code) {
    const resp = await axios
      .get(`${REFERRAL_URL}/${code}/check`)
      .then(res => res.data)
    return resp
  }

  async getByCode(code) {
    try {
      const resp = await axios
        .get(`${REFERRAL_URL}/${code}`)
        .then(res => res.data)
      return resp.data
    } catch (error) {
      console.log("error", JSON.stringify(error))
      return null
    }
  }
}

module.exports = new ReferralTrait()
