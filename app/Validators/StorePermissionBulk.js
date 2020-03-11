"use strict"

const { ResponseParser } = use("App/Helpers")
const messages = require("./messages")

class StorePermissionBulk {
  get rules() {
    return {
      permissions: "required|array",
      "permissions.*": "required|max:50",
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

module.exports = StorePermissionBulk
