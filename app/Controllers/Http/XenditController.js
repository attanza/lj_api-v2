"use strict"
const { ResponseParser } = use("App/Helpers")
class XenditController {
  async notifHandler({ request, response }) {
    console.log(request.body)
    return this.sendResponse(response)
  }

  sendResponse(response, data) {
    return response
      .status(200)
      .send(ResponseParser.successResponse(data, "Xendit notification handler"))
  }
}

module.exports = XenditController
