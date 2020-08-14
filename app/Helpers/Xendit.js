"use strict"

const Xendit = require("xendit-node")
const { orderStatus } = use("App/Helpers/Constants")
const generateActivator = require("./generateActivator")

const x = new Xendit({
  secretKey: process.env.XENDIT_SECRET,
})
const { EWallet } = x
const ewalletSpecificOptions = {}
const ew = new EWallet(ewalletSpecificOptions)
const isDev = process.env.NODE_ENV === "development"

const axios = require("axios")

class XenditHelper {
  setAxiosHeaders() {
    const token = Buffer.from(`${process.env.XENDIT_SECRET}:`).toString(
      "base64"
    )
    axios.defaults.headers.common["Authorization"] = `Basic ${token}`
    axios.defaults.headers.post["Content-Type"] = "application/json"
    axios.defaults.headers.post["Accept"] = "application/json"
  }

  async ovoPayment(order, phone) {
    this.setAxiosHeaders()
    const amount = isDev ? 80001 : order.price
    const postData = {
      external_id: order.order_no,
      amount,
      phone,
      ewallet_type: EWallet.Type.OVO,
    }
    // return ew.createPayment(postData)
    return axios.post("https://api.xendit.co/ewallets", postData)
  }

  async ovoStatus(externalID) {
    return ew.getPayment({
      externalID,
      ewalletType: EWallet.Type.OVO,
    })
  }

  async ovoCallbackHandler(order, data) {
    console.log("OVO handler")
    const successStatus = ["COMPLETED"]
    const failedStatus = ["FAILED"]
    const isSuccess = successStatus.includes(data.status)
    const isFailed = failedStatus.includes(data.status)
    order.payment_detail = JSON.stringify(data)

    if (isFailed) {
      order.status = orderStatus.PAYMENT_FAILED
    }
    if (isSuccess) {
      order.status = orderStatus.COMPLETED
      order.payment_with = data.ewallet_type
      await generateActivator(order)
    }
    await order.save()
    return order
  }
}

module.exports = new XenditHelper()
