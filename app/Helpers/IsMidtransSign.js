"use strict"

const crypto = require("crypto")
const Env = use("Env")

module.exports = request => {
  const receivedJson = request.post()
  const { order_id, status_code, gross_amount, signature_key } = receivedJson
  const NODE_ENV = Env.get("NODE_ENV")
  const isProd = NODE_ENV === "production"
  const midtransServerKey = isProd
    ? Env.get("MIDTRANS_SERVER_KEY")
    : Env.get("MIDTRANS_DEV_SERVER_KEY")
  const text = `${order_id}${status_code}${gross_amount}${midtransServerKey}`
  const sha512 = crypto
    .createHash("sha512")
    .update(text)
    .digest("hex")
  if (sha512 !== signature_key) return false
  else return true
}
