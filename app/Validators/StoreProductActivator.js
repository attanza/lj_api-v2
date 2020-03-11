"use strict"

const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")

class StoreProductActivator {
  get rules() {
    return {
      order_id: "required|integer|exists:online_product_orders,id",
      code: "required|max:30|unique:product_activators",
      device_id: "required|max:30",
      expired_at: "date",
      isActive: "boolean",
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

module.exports = StoreProductActivator
