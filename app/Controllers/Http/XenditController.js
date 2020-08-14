"use strict"

const Xendit = require("../../Helpers/Xendit")

const { ResponseParser } = use("App/Helpers")

class XenditController {
  async notifHandler({ request, response }) {
    try {
      console.log(request.body)
      const isProd = process.env.NODE_ENV === "production"
      const xenditIP = request.header("x-real-ip")
      if (isProd && xenditIP !== process.env.XENDIT_IP) {
        console.log("incorrect xendit ip address")
        return this.sendResponse(response)
      }

      const callbackToken = request.header("x-callback-token")
      if (isProd && callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
        console.log("incorrect callbackToken ip address")
        return this.sendResponse(response)
      }

      const { external_id, event, ewallet_type } = request.post()
      if (!external_id) {
        return response
          .status(422)
          .send(
            ResponseParser.apiValidationFailed({}, "external_id is required")
          )
      }

      if (event === "ewallet.payment" && ewallet_type === "OVO") {
        await Xendit.ovoCallbackHandler(request.post())
      }

      return response
        .status(200)
        .send(ResponseParser.successResponse(null, "Thank you"))
    } catch (error) {
      console.log("error", error)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = XenditController
