"use strict"

const axios = require("axios")
const Env = use("Env")
const { parseMicroApiQuery } = use("App/Helpers")

class ReferralTrait {
  constructor() {
    axios.defaults.baseURL = Env.get("REFERRAL_API")
  }
  async all(query) {
    const resp = await axios
      .get("referrals" + parseMicroApiQuery(query))
      .then(res => res.data)
    return resp
  }

  async store(data) {
    const resp = await axios.post("referrals", data).then(res => res.data)
    return resp
  }

  async show(id) {
    const resp = await axios.get("referrals/" + id).then(res => res.data)
    return resp
  }

  async update(id, data) {
    const resp = await axios.put("referrals/" + id, data).then(res => res.data)
    return resp
  }

  async destroy(id) {
    const resp = await axios.delete("referrals/" + id).then(res => res.data)
    return resp
  }
}

module.exports = new ReferralTrait()
