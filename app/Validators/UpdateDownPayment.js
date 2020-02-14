"use strict"

const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")

class UpdateDownPayment {
  get rules() {
    return {
      marketing_target_id: "required|integer",
      name: "required|max:50",
      phone: "required|max:50",
      dp: "required|integer",
      harga: "integer",
    }
  }

  get messages() {
    return messages
  }

  get sanitizationRules() {
    return {
      name: "trim|escape",
      description: "escape",
    }
  }

  async fails(errorMessages) {
    return this.ctx.response
      .status(422)
      .send(ResponseParser.apiValidationFailed(errorMessages))
  }
}

module.exports = UpdateDownPayment
