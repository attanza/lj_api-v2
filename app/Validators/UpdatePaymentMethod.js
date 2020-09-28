"use strict"
const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")
class UpdatePaymentMethod {
  get rules() {
    const id = this.ctx.params.id

    return {
      name: "required|max:50|unique:payment_methods,name,id," + id,
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

module.exports = UpdatePaymentMethod
