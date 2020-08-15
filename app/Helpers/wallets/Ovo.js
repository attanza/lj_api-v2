"use strict"

const ResponseParser = require("../ResponseParser")
const { validate } = use("Validator")
const validationMessage = use("App/Validators/messages")
const OnlineProductOrder = use("App/Models/OnlineProductOrder")
const Xendit = require("./Xendit")

module.exports = async (request, response) => {
  console.log("ovo handler")
  let rules = {}
  rules = {
    order_no: "required",
    phone: "required",
  }
  const validation = await validate(request.all(), rules, validationMessage)
  if (validation.fails()) {
    return response
      .status(200)
      .send(ResponseParser.apiValidationFailed(validation.messages()))
  }

  const { order_no, phone } = request.post()

  const order = await Xendit.getOrderByNo(order_no)
  if (!order) {
    return response
      .status(400)
      .send(ResponseParser.apiNotFound("Order not found"))
  }

  const resp = await Xendit.ovoPayment(order.toJSON(), phone)
  return response
    .status(200)
    .send(ResponseParser.successResponse(resp, "OVO Payment"))
}
