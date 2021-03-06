"use strict"

const Xendit = use("App/Helpers/wallets/Xendit")
const { ResponseParser } = use("App/Helpers")

class XenditController {
  async notifHandler({ request, response }) {
    try {
      console.log(new Date())
      console.log(request.body)
      const isProd = process.env.NODE_ENV === "production"

      const callbackToken = request.header("x-callback-token")
      if (isProd && callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
        console.log("incorrect callbackToken ip address")
        return response
          .status(200)
          .send(ResponseParser.successResponse(null, "Thank you"))
      }

      const { external_id, event, qr_code } = request.post()
      let orderNo = external_id
      if (event === "qr.payment") {
        orderNo = qr_code.external_id
      }
      if (!orderNo) {
        return response
          .status(422)
          .send(
            ResponseParser.apiValidationFailed({}, "external_id is required")
          )
      }

      await Xendit.callbackHandler(request.post())

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
