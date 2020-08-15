"use strict"

const Xendit = require("xendit-node")
const { orderStatus } = use("App/Helpers/Constants")
const generateActivator = require("../generateActivator")
const Order = use("App/Models/OnlineProductOrder")
const moment = require("moment")

const isDev = process.env.NODE_ENV === "development"
const x = new Xendit({
  secretKey: getXenditSecret(),
})
const { EWallet, QrCode } = x
const ew = new EWallet({})
const q = new QrCode({})

function getXenditSecret() {
  return isDev ? process.env.XENDIT_DEV_SECRET : process.env.XENDIT_SECRET
}
function getCallbackUrl() {
  return isDev
    ? "https://staging-admin.langsungjalan.com/api/v1/xendit-notification"
    : "https://api.langsungjalan.com/api/v1/xendit-notification"
}

class XenditHelper {
  /**
   * OVO Payment Handler
   * @param {object} order
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
   * @param {object} order
   */
  async danaPayment(order) {
    const callbackUrl = getCallbackUrl()
    const now = moment()
    // const amount = isDev ? 80001 : order.price
    const amount = order.price
    const postData = {
      externalID: order.order_no,
      amount,
      expirationDate: now.add(5, "m").toDate(),
      callbackURL: callbackUrl,
      redirectURL: "https://api.langsungjalan.com",
      ewalletType: EWallet.Type.Dana,
    }
    console.log("postData", postData)
    return ew.createPayment(postData)
  }

  /**
   * Link Aja Payment Handler
   * @param {object} order
   * @param {String} phone
   *
   */
  async linkAjaPayment(order, phone) {
    const callbackUrl = getCallbackUrl()
    const amount = order.price
    const item = {
      id: order.product.id.toString(),
      name: order.product.name,
      price: parseInt(order.product.price),
      quantity: 1,
    }
    const postData = {
      externalID: order.order_no,
      phone,
      amount,
      items: [item],
      callbackURL: callbackUrl,
      redirectURL: "https://api.langsungjalan.com",
      ewalletType: EWallet.Type.LinkAja,
    }
    console.log("postData", postData)
    return ew.createPayment(postData)
  }

  /**
   * QR Code Payment Handler
   * @param {object} order
   */
  async qrPayment(order) {
    const callbackUrl = getCallbackUrl()
    const amount = order.price
    const postData = {
      externalID: order.order_no,
      type: QrCode.Type.Dynamic,
      amount,
      callbackURL: callbackUrl,
    }
    console.log("postData", postData)
    return q.createCode(postData)
  }

  /**
   * Simulate QR Code Payment
   * @param {object} order
   */
  async qrSimulate(order) {
    const amount = order.price
    const postData = {
      externalID: order.order_no,
      amount,
    }
    console.log("postData", postData)
    return q.simulate(postData)
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
      ewalletType: EWallet.Type.Dana,
    })
  }

  /**
   * GET Link Aja Payment Status
   * @param {String} externalID
   */
  async linkAjaStatus(externalID) {
    return ew.getPayment({
      externalID,
      ewalletType: EWallet.Type.LinkAja,
    })
  }

  /**
   * OVO Callback Handler
   * @param {object} ctx
   */
  async callbackHandler(ctx) {
    const { external_id, status, payment_status, event, qr_code } = ctx
    let orderNo = external_id
    if (event === "qr.payment") {
      orderNo = qr_code.external_id
      ctx.ewallet_type = "QR"
    }
    const order = await this.getOrderByNo(orderNo)

    if (order) {
      try {
        const walletStatus = status || payment_status
        const successStatus = ["COMPLETED", "PAID", "SUCCESS_COMPLETED"]
        const failedStatus = ["FAILED", "EXPIRED"]
        const isSuccess = successStatus.includes(walletStatus)
        const isFailed = failedStatus.includes(walletStatus)
        order.payment_detail = JSON.stringify(ctx)
        order.payment_with = ctx.ewallet_type

        if (isFailed) {
          order.status = orderStatus.PAYMENT_FAILED
        }
        if (isSuccess) {
          order.status = orderStatus.COMPLETED
          await generateActivator(order)
        }
        await order.save()
        return order
      } catch (error) {
        console.log("error in callback", error)
      }
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
