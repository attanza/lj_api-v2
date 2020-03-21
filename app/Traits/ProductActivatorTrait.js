"use strict"

const ProductActivator = use("App/Models/ProductActivator")
const randomstring = require("randomstring")

class ProductActivatorTrait {
  async store(ctx) {
    const { order_id, device_id } = ctx
    const data = await ProductActivator.create({
      order_id,
      device_id,
      code: await this.generateActivationCode(),
    })
    return data
  }

  async generateActivationCode() {
    let retry = 1
    let code = ""
    while (retry !== 0) {
      code = randomstring.generate({
        length: 12,
        charset: "alphanumeric",
        capitalization: "lowercase",
      })
      const activation = await ProductActivator.findBy("code", code)
      if (!activation) {
        retry = 0
        return code
      }
    }
  }
}

module.exports = new ProductActivatorTrait()
