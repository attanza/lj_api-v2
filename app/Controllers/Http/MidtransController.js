"use strict"
const { ResponseParser } = use("App/Helpers")
class MidtransController {
  async notifHandler({ request, response }) {
    return response
      .status(200)
      .send(
        ResponseParser.successResponse(null, "Midtrans notification handler")
      )
  }
}

module.exports = MidtransController
