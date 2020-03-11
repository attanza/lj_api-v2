"use strict"

const Product = use("App/Models/Product")
const { ResponseParser } = use("App/Helpers")
const Env = use("Env")
const jwt = require("jsonwebtoken")
class ClientController {
  async generateToken({ request, response }) {
    const { product } = request.get()
    if (!product) {
      return response.status(400).send(ResponseParser.apiNotFound())
    }
    const productFromDb = await Product.findBy("code", product)
    if (!productFromDb) {
      return response.status(400).send(ResponseParser.apiNotFound())
    }
    const secret = Env.get("CLIENT_TOKEN")
    const token = await jwt.sign({ product }, secret, { expiresIn: "1m" })
    return response.status(200).send(ResponseParser.apiItem({ token }))
  }
}

module.exports = ClientController
