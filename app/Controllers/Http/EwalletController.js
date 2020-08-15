"use strict"

const { ResponseParser } = use("App/Helpers")
const { Xendit, Ovo, Dana } = use("App/Helpers/wallets")
class EwalletController {
  async pay({ request, response }) {
    try {
      const walletType = request.params.type
      if (walletType === "ovo") {
        return Ovo(request, response)
      }
      if (walletType === "dana") {
        return Dana(request, response)
      }
      return response
        .status(400)
        .send(ResponseParser.errorResponse("Unknown e-wallet"))
    } catch (err) {
      console.log("err", err)
      return response
        .status(400)
        .send(ResponseParser.errorResponse(err.message))
    }
  }

  async status({ request, response }) {
    try {
      const { type, id } = request.params
      if (type === "ovo") {
        const resp = await Xendit.ovoStatus(id)
        await Xendit.callbackHandler(resp)
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
