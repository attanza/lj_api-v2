"use strict"
const {
  ResponseParser,
  MailHelper,
  ErrorLog,
  IsMidtransSign,
  NodeMailer,
} = use("App/Helpers")
const { ProductActivatorTrait } = use("App/Traits")
const Order = use("App/Models/OnlineProductOrder")
const { orderStatus } = use("App/Helpers/Constants")

class MidtransController {
  async notifHandler({ request, response }) {
    try {
      // if (IsMidtransSign(request)) {
      const {
        order_id,
        status_code,
        payment_type,
        transaction_status,
      } = request.post()
      if (status_code === "200") {
        // Check if order exists
        const order = await Order.query()
          .where("order_no", order_id)
          .where("status", orderStatus.WAITING_FOR_PAYMENT)
          .first()

        if (!order) {
          console.log("Order not found")
          return this.sendResponse(response)
        }

        // Check for success status
        const successStatus = ["capture", "settlement"]
        if (successStatus.includes(transaction_status)) {
          console.log("Order Completed")
          order.status = orderStatus.COMPLETED
          order.payment_with = payment_type
          order.payment_detail = JSON.stringify(request.post())
          await order.save()
          await this.generateActivator(order)
          return this.sendResponse(response, null)
        }

        // Check for failure status
        const failureStatus = ["deny", "failure"]
        if (failureStatus.includes(transaction_status)) {
          console.log("Order PAYMENT_FAILED")
          order.status = orderStatus.PAYMENT_FAILED
        }

        // Check for cancel status
        if (transaction_status === "cancel") {
          console.log("Order CANCELED")
          order.status = orderStatus.CANCELED
        }

        // Check for expire status
        if (transaction_status === "expire") {
          console.log("Order PAYMENT_EXPIRED")
          order.status = orderStatus.PAYMENT_EXPIRED
        }
        order.payment_detail = JSON.stringify(request.post())
        await order.save()
      }
      // }
      // console.log("Signature not verified")
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

  async generateActivator(order) {
    await order.load("product")
    // Generate and send activation key
    const activator = await ProductActivatorTrait.store({
      order_id: order.id,
      device_id: order.device_id,
    })
    const jsonOrder = order.toJSON()
    jsonOrder.activator = activator.toJSON()
    await NodeMailer.sendMail({
      to: order.email,
      subject: `Aktifasi Produk Yapindo`,
      template: "productActivationCode",
      data: jsonOrder,
    })

    return activator.toJSON()
  }
}

module.exports = MidtransController

// va_numbers: [ { va_number: '239606404234247', bank: 'bca' } ],
// transaction_time: '2020-03-12 15:06:51',
// transaction_status: 'pending',
// transaction_id: '7bbfc7b9-3872-4073-8322-daba2e6660a3',
// status_message: 'midtrans payment notification',
// status_code: '201',
// signature_key: 'dae54ee885ce502ab0b0e97e64b400dc146381a82d6bc8931a0df6a3c3a3b55d9d14613e99439f0f51791ec0b4945c33ddc7ea71b353caf8cef7c9b309342d5f',
// payment_type: 'bank_transfer',
// payment_amounts: [],
// order_id: 'order-id-node-1584000375',
// merchant_id: 'G239606404',
// gross_amount: '200000.00',
// fraud_status: 'accept',
// currency: 'IDR'
//

// transaction_time: '2020-03-12 15:11:27',
// transaction_status: 'pending',
// transaction_id: '5bd601d2-2e13-4e4a-8d4f-64cb0e7a584e',
// status_message: 'midtrans payment notification',
// status_code: '201',
// signature_key: '2cc4426541f0c2ed7596013d815f0ef7543bba82fffe867124fab5ed96049fd161e14980e03845f2fd6657fb40c5e07dc9820a719b4f833d700e5fbc990a7383',
// payment_type: 'gopay',
// order_id: 'order-id-node-1584000667',
// merchant_id: 'G239606404',
// gross_amount: '200000.00',
// fraud_status: 'accept',
// currency: 'IDR'

// va_numbers: [ { va_number: '239606404384286', bank: 'bca' } ],
// transaction_time: '2020-03-12 15:13:18',
// transaction_status: 'pending',
// transaction_id: 'e849d72c-ea34-4089-83f9-d5922de7bbd1',
// status_message: 'midtrans payment notification',
// status_code: '201',
// signature_key: '48441d4e76c93ef264e6082cbc1847737d92581c7c2123782c17e447de314ff2a127b5f3a8c8f5531ef36b9a8f1943a2e328605dd3a1ebac906223a498535054',
// payment_type: 'bank_transfer',
// payment_amounts: [],
// order_id: 'order-id-node-1584000777',
// merchant_id: 'G239606404',
// gross_amount: '200000.00',
// fraud_status: 'accept',
// currency: 'IDR'

// "transaction_time": "2020-03-12 15:16:34",
// "transaction_status": "capture",
// "transaction_id": "bd9e77fd-f000-41b2-a794-b2ba0f4a9574",
// "status_message": "midtrans payment notification",
// "status_code": "200",
// "signature_key": "751b5a8cf4369fbfb07e3035640518d84bcd4c4915732a2fcad7c10af9bcc05c69d4428b86d7a3d4339adf262f33ed5127c1a2646bcef50df71727d1175f523b",
// "payment_type": "credit_card",
// "order_id": "order-id-node-1584000915",
// "merchant_id": "G239606404",
// "masked_card": "481111-1114",
// "gross_amount": "200000.00",
// "fraud_status": "accept",
// "eci": "05",
// "currency": "IDR",
// "channel_response_message": "Approved",
// "channel_response_code": "0",
// "card_type": "credit",
// "bank": "bca",
// "approval_code": "1584001008720"

// WAITING_FOR_PAYMENT: "WAITING_FOR_PAYMENT",
//   PAYMENT_EXPIRED: "PAYMENT_EXPIRED",
//   PAYMENT_FAILED: "PAYMENT_FAILED",
//   COMPLETED: "COMPLETED",
//   CANCELED: "CANCELED",

// const midtransStatus = [
//   "authorize",
//   "capture",
//   "settlement",
//   "deny",
//   "pending",
//   "cancel",
//   "refund",
//   "partial_refund",
//   "chargeback",
//   "partial_chargeback",
//   "expire",
//   "failure",
// ]
