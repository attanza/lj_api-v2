"user strict"

const jwt = require("jsonwebtoken")
const Env = use("Env")

const { ResponseParser } = use("App/Helpers")

class ClientController {
  async generateToken({ request, response }) {
    try {
      const { product } = request.get()
      const secret = Env.get("CLIENT_TOKEN")
      const token = await jwt.sign(
        {
          product,
        },
        secret,
        { expiresIn: "2m" }
      )
      return response.status(200).send(ResponseParser.apiItem(token))
    } catch (error) {
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = ClientController
