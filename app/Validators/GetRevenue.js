"use strict"

const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")

class GetRevenue {
  get rules() {
    return {
      start_date: "required|date",
      end_date: "required|date",
    }
  }

  get messages() {
    return messages
  }

  async fails(errorMessages) {
    return this.ctx.response
      .status(422)
      .send(ResponseParser.apiValidationFailed(errorMessages))
  }
}

module.exports = GetRevenue
