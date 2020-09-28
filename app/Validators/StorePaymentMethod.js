"use strict"
const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")
class StorePaymentMethod {
  get rules() {
    return {
      name: "required|max:50|unique:payment_methods",
      is_active: "required|boolean",
    }
  }

  get messages() {
    return messages
  }

  get sanitizationRules() {
    return {
      name: "escape",
    }
  }

  async fails(errorMessages) {
    return this.ctx.response
      .status(422)
      .send(ResponseParser.apiValidationFailed(errorMessages))
  }
}

module.exports = StorePaymentMethod
