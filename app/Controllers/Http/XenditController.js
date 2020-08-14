"use strict"
const { ResponseParser } = use("App/Helpers")
class XenditController {
  async notifHandler({ request, response }) {
    const headers = request.headers()
    console.log("headers", headers)
    console.log(request.body)
    return this.sendResponse(response)
  }

  sendResponse(response, data) {
    return response
      .status(200)
      .send(ResponseParser.successResponse(data, "Xendit notification handler"))
  }
}

module.exports = XenditController

// {
//     id: '4876b696-a922-4bb5-a0b5-d23132206a70',
//     event: 'ewallet.payment',
//     phone: '081880001',
//     amount: 1001,
//     status: 'COMPLETED',
//     created: '2020-08-14T00:58:49.154Z',
//     business_id: '5d9700b423cd651e7626344d',
//     external_id: 'ovo-ewallet-testing-id-1',
//     ewallet_type: 'OVO'
//   }
