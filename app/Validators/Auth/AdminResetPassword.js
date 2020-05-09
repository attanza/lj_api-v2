"use strict"

const { ResponseParser } = use("App/Helpers")
const messages = require("../messages")

class AdminResetPassword {
  get rules() {
    return {
      password: "required|min:6",
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

module.exports = AdminResetPassword
