"use strict"

const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")

class UpdateReferral {
  get rules() {
    return {
      code: "string|min:3",
      maxConsumer: "integer",
      products: "array",
      "products.*.id": "integer|exists:products,id",
      "products.*.name": "string|max:50",
      validUntil: "date",
      description: "max:250",
      consumer: "array",
      "consumer.*.id": "integer|exists:products,id",
      "consumer.*.email": "email",
      isExpired: "boolean",
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
