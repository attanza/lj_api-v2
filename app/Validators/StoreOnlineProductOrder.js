"use strict"

const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")

class StoreOnlineProductOrder {
  get rules() {
    return {
      product_code: "required|exists:products,code",
      name: "required|string|max:50",
      email: "required|email",
      phone: "required|string|max:30",
      university: "required|string|max:100",
      referral: "string|max:50",
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

module.exports = StoreOnlineProductOrder
