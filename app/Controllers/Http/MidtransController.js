"use strict"
const {
  ResponseParser,
  ErrorLog,
  IsMidtransSign,
  NodeMailer,
  MailJet,
  Midtrans,
} = use("App/Helpers")
const Order = use("App/Models/OnlineProductOrder")
const { orderStatus } = use("App/Helpers/Constants")
class MidtransController {
  async notifHandler({ request, response }) {
    try {
      if (IsMidtransSign(request)) {
        const { order_id, status_code } = request.post()
        if (status_code === "200") {
          // Check if order exists
          let order = await Order.query()
            .where("order_no", order_id)
            .where("status", orderStatus.WAITING_FOR_PAYMENT)
            .first()

          if (!order) {
            console.log("Order not found")
            return this.sendResponse(response)
          }
          await Midtrans.statusActions(request.post(), order)
          return this.sendResponse(response)
        }
      }
      console.log("Signature not verified")
      return this.sendResponse(response)
    } catch (e) {
      console.log("e", e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  sendResponse(response, data) {
    return response
      .status(200)
      .send(
        ResponseParser.successResponse(data, "Midtrans notification handler")
      )
  }
}

module.exports = MidtransController
