"use strict"

const Xendit = require("xendit-node")
const { orderStatus } = use("App/Helpers/Constants")
const generateActivator = require("../generateActivator")
const Order = use("App/Models/OnlineProductOrder")
const moment = require("moment")

const x = new Xendit({
  secretKey: process.env.XENDIT_SECRET,
})
const { EWallet } = x
const ewalletSpecificOptions = {}
const ew = new EWallet(ewalletSpecificOptions)
const isDev = process.env.NODE_ENV === "development"

class XenditHelper {
  /**
   * OVO Payment Handler
   * @param {String} order
   * @param {String} phone
   */
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

  /**
   * DANA Payment Handler
   * @param {String} order
   */
  async danaPayment(order) {
    const callbackUrl =
      "https://staging-admin.langsungjalan.com/api/v1/xendit-notification"
    const now = moment()
    const amount = isDev ? 80001 : order.price
    const postData = {
      externalID: order.order_no,
      amount,
      expirationDate: now.add(5, "m").format(),
      callbackURL: callbackUrl,
      redirectURL: callbackUrl,
      ewalletType: EWallet.Type.DANA,
    }

    return ew.createPayment(postData)
  }

  /**
   * GET Ovo Payment Status
   * @param {String} externalID
   */
  async ovoStatus(externalID) {
    return ew.getPayment({
      externalID,
      ewalletType: EWallet.Type.OVO,
    })
  }

  /**
   * GET Dana Payment Status
   * @param {String} externalID
   */
  async danaStatus(externalID) {
    return ew.getPayment({
      externalID,
      ewalletType: EWallet.Type.DANA,
    })
  }

  /**
   * OVO Callback Handler
   * @param {object} ctx
   */
  async callbackHandler(ctx) {
    const { external_id, status, ewallet_type } = ctx
    const order = await this.getOrderByNo(external_id)

    if (order) {
      const successStatus = ["COMPLETED", "PAID"]
      const failedStatus = ["FAILED", "EXPIRED	"]
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

  /**
   * GET Order by Order number where status is WAITING_FOR_PAYMENT (new order)
   * @param {String} orderNo
   */
  async getOrderByNo(orderNo) {
    return Order.query()
      .where("order_no", orderNo)
      .where("status", orderStatus.WAITING_FOR_PAYMENT)
      .first()
  }
}

module.exports = new XenditHelper()
