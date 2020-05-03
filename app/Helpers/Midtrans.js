"use strict"
const axios = require("axios")
const Env = use("Env")
const { orderStatus } = require("./Constants")
const generateActivator = require("./generateActivator")

const isProd = Env.get("NODE_ENV") === "production"
const MIDTRANS_URL = isProd
  ? Env.get("MIDTRANS_URL")
  : Env.get("MIDTRANS_DEV_URL")

class Midtrans {
  setAxiosHeaders() {
    const midtransServerKey = isProd
      ? Env.get("MIDTRANS_SERVER_KEY")
      : Env.get("MIDTRANS_DEV_SERVER_KEY")

    const token = Buffer.from(`${midtransServerKey}:`).toString("base64")
    axios.defaults.headers.common["Authorization"] = `Basic ${token}`
    axios.defaults.headers.post["Content-Type"] = "application/json"

    axios.defaults.headers.post["Accept"] = "application/json"
  }

  async getOrder(order_id) {
    try {
      this.setAxiosHeaders()
      const resp = await axios
        .get(`${MIDTRANS_URL}/v2/${order_id}/status`)
        .then(res => res.data)
      return resp
    } catch (e) {
      console.log("Midtrans Error")
      throw e
    }
  }

  async statusActions(ctx, order) {
    const { transaction_status, payment_type } = ctx
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

    // Check for success status
    const successStatus = ["capture", "settlement"]
    if (successStatus.includes(transaction_status)) {
      console.log("Order Completed")
      order.status = orderStatus.COMPLETED
      order.payment_with = payment_type
      order.payment_detail = JSON.stringify(ctx)
      await generateActivator(order)
    }

    order.payment_detail = JSON.stringify(ctx)
    await order.save()
    return order
  }
}

module.exports = new Midtrans()
