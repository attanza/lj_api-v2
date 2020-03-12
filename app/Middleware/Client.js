"use strict"

const { ResponseParser } = use("App/Helpers")
const Env = use("Env")
const jwt = require("jsonwebtoken")
const Product = use("App/Models/Product")
class Client {
  async handle({ request, response }, next) {
    try {
      const lj_token = request.headers()["x-lj-token"]
      if (!lj_token) {
        console.log("no token")
        return response.status(401).send(ResponseParser.unauthorizedResponse())
      }

      const secret = Env.get("CLIENT_TOKEN")
      const decoded = await jwt.verify(lj_token, secret)
      if (!decoded.product) {
        console.log("no decoded.product")
        return response.status(401).send(ResponseParser.unauthorizedResponse())
      }

      const productFromDb = await Product.findBy("code", decoded.product)
      if (!productFromDb) {
        console.log("no product")
        return response.status(401).send(ResponseParser.unauthorizedResponse())
      }

      return next()
    } catch (e) {
      return response.status(401).send(ResponseParser.unauthorizedResponse())
    }
  }
}

module.exports = Client
