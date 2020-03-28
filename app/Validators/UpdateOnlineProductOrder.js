"use strict"

const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")

class UpdateOnlineProductOrder {
  get rules() {
    return {
      name: "string|max:50",
      email: "email",
      phone: "string|max:30",
      university: "string|max:100",
      status:
        "string|in:WAITING_FOR_PAYMENT,PAYMENT_EXPIRED,PAYMENT_FAILED,COMPLETED,CANCELED",
      marketing_id: "integer|exists:users,id",
      product_id: "integer|exists:products,id",
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

module.exports = UpdateOnlineProductOrder
