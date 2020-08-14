"use strict"

const Xendit = require("xendit-node")
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
    console.log("postData", postData)
    return ew.createPayment(postData)
  }
}

module.exports = new XenditHelper()
