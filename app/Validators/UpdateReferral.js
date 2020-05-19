"use strict"

const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")

class UpdateReferral {
  get rules() {
    return {
      code: "string|min:3",
      maxConsumer: "integer",
      validUntil: "date",
      isExpired: "boolean",
      description: "max:250",
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

module.exports = UpdateReferral
