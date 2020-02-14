"use strict"

const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")

class StoreReferral {
  get rules() {
    return {
      code: "required|string|min:3",
      maxConsumer: "integer",
      products: "array",
      // "products.*.id": "required|integer|exists:products,id",
      // "products.*.name": "required|string|max:50",
      validUntil: "required|date",
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

module.exports = StoreReferral
