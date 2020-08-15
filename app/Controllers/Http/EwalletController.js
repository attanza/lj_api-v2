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
          .send(ResponseParser.successResponse(resp, "OVO Payment Status"))
      }
      if (type === "dana") {
        const resp = await Xendit.danaStatus(id)
        await Xendit.callbackHandler(resp)
        return response
          .status(200)
          .send(ResponseParser.successResponse(resp, "Dana Payment Status"))
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
