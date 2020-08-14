"use strict"

const { ResponseParser } = use("App/Helpers")
const { validate } = use("Validator")
const validationMessage = use("App/Validators/messages")
const OnlineProductOrder = use("App/Models/OnlineProductOrder")
const Xendit = use("App/Helpers/Xendit")
class EwalletController {
  async pay({ request, response }) {
    try {
      const walletType = request.params.type
      let rules = {}
      if (walletType === "ovo") {
        rules = {
          order_no: "required|in:ovo",
          phone: "required",
        }
        const validation = await validate(
          request.all(),
          rules,
          validationMessage
        )
        if (validation.fails()) {
          console.log(validation.messages())
          return response
            .status(200)
            .send(ResponseParser.apiValidationFailed(validation.messages()))
        }

        const { order_no, phone } = request.post()

        const order = await OnlineProductOrder.findBy("order_no", order_no)
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
      return response
        .status(400)
        .send(ResponseParser.errorResponse("Unknown e-wallet"))
    } catch (err) {
      return response
        .status(err.status)
        .send(ResponseParser.errorResponse(err.message))
    }
  }

  async status({ request, response }) {
    try {
      const { type, id } = request.params
      let rules = {}
      if (type === "ovo") {
        const resp = await Xendit.ovoStatus(id)
        await Xendit.ovoCallbackHandler(resp)
        return response
          .status(200)
          .send(ResponseParser.successResponse(resp, "OVO Payment"))
      }
      return response
        .status(400)
        .send(ResponseParser.errorResponse("Unknown e-wallet"))
    } catch (err) {
      console.log("err", err)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = EwalletController

// {
//   "external_id":"ovo-ewallet-testing-id-1",
//   "amount":"1001",
//   "phone":"081880001",
//   "ewallet_type":"OVO"
//   }

// {
//   "amount": 1001,
//   "business_id": "5d9700b423cd651e7626344d",
//   "created": "2020-08-14T04:05:40.532Z",
//   "ewallet_type": "OVO",
//   "external_id": "ovo-ewallet-testing-id-12",
//   "phone": "081880001",
//   "status": "PENDING"
// }

//  {
//      id: '9c62d423-b680-4765-8560-5d59b2b4deb6',
//      event: 'ewallet.payment',
//      phone: '081880001',
//      amount: 1001,
//      status: 'COMPLETED',
//      created: '2020-08-14T05:14:06.980Z',
//      business_id: '5d9700b423cd651e7626344d',
//      external_id: '1597382029',
//      ewallet_type: 'OVO'
//    }
