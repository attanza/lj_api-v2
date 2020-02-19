"use strict"

const { ResponseParser, ErrorLog } = use("App/Helpers")
const Product = use("App/Models/Product")
const OnlineProductOrder = use("App/Models/OnlineProductOrder")
const { ReferralTrait } = use("App/Traits")
const moment = require("moment")
const { orderStatus } = use("App/Helpers/Constants")
class OnlineProductOrderController {
  async store({ request, response }) {
    try {
      const fillable = [
        "product_code",
        "name",
        "email",
        "phone",
        "university",
        "device_id",
        "referral",
      ]
      const body = request.only(fillable)

      // Get ReferralData
      const referralData = await ReferralTrait.getByCode(body.referral)

      // Get Product Data
      const product = await Product.findBy("code", body.product_code)
      if (!product) {
        return response
          .status(400)
          .send(ResponseParser.errorResponse("Product not found"))
      }

      // generate order data
      const orderData = {
        order_no: moment()
          .unix()
          .toString(),
        status: orderStatus.WAITING_FOR_PAYMENT,
        name: body.name,
        email: body.email,
        phone: body.phone,
        university: body.university,
        device_id: body.device_id,
        referral: body.referral,
        marketing_id: parseInt(referralData.creator.id),
        product_id: product.id,
      }

      const newOrder = await OnlineProductOrder.create(orderData)

      return response.status(200).send(ResponseParser.apiCreated(newOrder))
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = OnlineProductOrderController
