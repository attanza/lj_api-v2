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
    return ew.createPayment(postData)
  }

  async ovoStatus(externalID) {
    return ew.getPayment({
      externalID,
      ewalletType: EWallet.Type.OVO,
    })
  }
}

module.exports = new XenditHelper()
