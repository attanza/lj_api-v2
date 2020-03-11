"use strict"

const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")

class ActivatorActivate {
  get rules() {
    return {
      code: "required",
      device_id: "required",
    }
  }

  get messages() {
    return messages
  }

  get sanitizationRules() {
    return {
      code: "escape",
      device_id: "escape",
    }
  }

  async fails(errorMessages) {
    return this.ctx.response
      .status(422)
      .send(ResponseParser.apiValidationFailed(errorMessages))
  }
}

module.exports = ActivatorActivate
