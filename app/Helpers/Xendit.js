"use strict"

const Xendit = require("xendit-node")
const { orderStatus } = use("App/Helpers/Constants")
const generateActivator = require("./generateActivator")
const Order = use("App/Models/OnlineProductOrder")

const x = new Xendit({
  secretKey: process.env.XENDIT_SECRET,
})
const { EWallet } = x
const ewalletSpecificOptions = {}
const ew = new EWallet(ewalletSpecificOptions)
const isDev = process.env.NODE_ENV === "development"

class XenditHelper {
  async ovoPayment(order, phone) {
    const amount = isDev ? 80001 : order.price
    const postData = {
      externalID: order.order_no,
      amount,
      phone,
      ewalletType: EWallet.Type.OVO,
    }

    return ew.createPayment(postData)
  }

  async ovoStatus(externalID) {
    return ew.getPayment({
      externalID,
      ewalletType: EWallet.Type.OVO,
    })
  }

  async ovoCallbackHandler(ctx) {
    console.log("OVO handler")

    const { external_id, status, ewallet_type } = ctx
    const order = await Order.query()
      .where("order_no", external_id)
      .where("status", orderStatus.WAITING_FOR_PAYMENT)
      .first()

    if (order) {
      const successStatus = ["COMPLETED"]
      const failedStatus = ["FAILED"]
      const isSuccess = successStatus.includes(status)
      const isFailed = failedStatus.includes(status)
      order.payment_detail = JSON.stringify(ctx)

      if (isFailed) {
        status = orderStatus.PAYMENT_FAILED
      }
      if (isSuccess) {
        order.status = orderStatus.COMPLETED
        order.payment_with = ewallet_type
        await generateActivator(order)
      }
      await order.save()
      return order
    }
    console.log("order not found")
    return null
  }

  errorParser(err) {
    const error = err.response.data
  }
}

module.exports = new XenditHelper()
// {
//     id: 'b0b27590-625d-4e26-ad01-951e20f4c13f',
//     event: 'ewallet.payment',
//     phone: '081880001',
//     amount: 1001,
//     status: 'COMPLETED',
//     created: '2020-08-14T09:26:45.678Z',
//     business_id: '5d9700b423cd651e7626344d',
//     external_id: '1597397196',
//     ewallet_type: 'OVO'
//   }
