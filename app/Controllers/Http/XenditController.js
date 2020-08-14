"use strict"

const Xendit = require("../../Helpers/Xendit")

const { ResponseParser } = use("App/Helpers")
const Order = use("App/Models/OnlineProductOrder")
const { orderStatus } = use("App/Helpers/Constants")
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

      const { external_id } = request.post()
      if (!external_id) {
        return response
          .status(422)
          .send(
            ResponseParser.apiValidationFailed({}, "external_id is required")
          )
      }

      let order = await Order.query()
        .where("order_no", external_id)
        // .where("status", orderStatus.WAITING_FOR_PAYMENT)
        .first()

      if (!order) {
        console.log("Order not found")
        return this.sendResponse(response)
      }
      const { event, ewallet_type } = request.body
      console.log({ event, ewallet_type })
      if (event === "ewallet.payment" && ewallet_type === "OVO") {
        await Xendit.ovoCallbackHandler(order, request.body)
      }

      return this.sendResponse(response)
    } catch (error) {
      console.log("error", error)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  sendResponse(response, data) {
    return response
      .status(200)
      .send(ResponseParser.successResponse(data, "Xendit notification handler"))
  }
}

module.exports = XenditController
