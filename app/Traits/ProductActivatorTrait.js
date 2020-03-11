"use strict"

const ProductActivator = use("App/Models/ProductActivator")
const moment = require("moment")
class ProductActivatorTrait {
  async store(ctx) {
    const { order_id, device_id } = ctx
    const now = moment()
    const data = await ProductActivator.create({
      order_id,
      device_id,
      code: now.unix().toString(),
    })
    return data
  }
}

module.exports = new ProductActivatorTrait()
