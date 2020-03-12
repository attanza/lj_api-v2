"use strict"
const { ResponseParser, MailHelper, ErrorLog } = use("App/Helpers")
const { ProductActivatorTrait } = use("App/Traits")
const Order = use("App/Models/OnlineProductOrder")
const { orderStatus } = use("App/Helpers/Constants")
class MidtransController {
  async notifHandler({ request, response }) {
    try {
      // const {
      //   order_id,
      //   status_code,
      //   gross_amount,
      //   signature_key,
      // } = request.post()
      // // Verify signature

      // //  and update order Accordingly
      // if (!order_id) {
      //   return response.status(400).send(ResponseParser.apiNotFound())
      // }
      // const order = await Order.findBy("order_no", order_id)
      // if (!order) {
      //   return response.status(400).send(ResponseParser.apiNotFound())
      // }
      // order.status = orderStatus.COMPLETED
      // await order.save()
      // await order.load("product")
      // // Generate and send activation key
      // const activator = await ProductActivatorTrait.store({
      //   order_id: order.id,
      //   device_id: order.device_id,
      // })

      // // Send activation key via email
      // MailHelper.activationCodeMail({
      //   order: order.toJSON(),
      //   activator: activator.toJSON(),
      // })

      // return response
      //   .status(200)
      //   .send(
      //     ResponseParser.successResponse(
      //       activator,
      //       "Midtrans notification handler"
      //     )
      //   )
      console.log(request.post())
      return "ok"
    } catch (e) {
      console.log("e", e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = MidtransController
