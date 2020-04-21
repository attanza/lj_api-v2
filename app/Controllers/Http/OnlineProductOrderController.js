"use strict"

const {
  ResponseParser,
  ErrorLog,
  RedisHelper,
  GetRequestQuery,
  Midtrans,
} = use("App/Helpers")
const Product = use("App/Models/Product")
const OnlineProductOrder = use("App/Models/OnlineProductOrder")
const { ReferralTrait, ActivityTraits } = use("App/Traits")
const { orderStatus } = use("App/Helpers/Constants")
const fillable = [
  "product_code",
  "name",
  "email",
  "phone",
  "university",
  "device_id",
  "referral",
]
const moment = require("moment")
class OnlineProductOrderController {
  async index({ request, response, auth }) {
    try {
      const query = await GetRequestQuery({
        request,
        auth,
        role: "marketing",
        key: "marketing_id",
      })
      const { redisKey } = query
      const cache = await RedisHelper.get("OnlineProductOrder_" + redisKey)
      if (cache && cache != null) {
        return cache
      }
      const {
        search,
        search_by,
        search_query,
        between_date,
        start_date,
        end_date,
        sort_by,
        sort_mode,
        page,
        limit,
      } = query
      const regexSearchKeys = ["order_no", "email", "phone", "status", "name"]
      const searchKeys = ["marketing_id", "product_id"]
      const data = await OnlineProductOrder.query()
        .with("marketing", builder => {
          builder.select("id", "name", "email")
        })
        .with("product", builder => {
          builder.select("id", "name", "code", "price", "discount_price")
        })
        .where(function() {
          if (search && search != "") {
            this.where(regexSearchKeys[0], "like", `%${search}%`)
            regexSearchKeys.forEach(s => this.orWhere(s, "like", `%${search}%`))
          }

          if (search_by && searchKeys.includes(search_by) && search_query) {
            this.where(search_by, search_query)
          }

          if (between_date && start_date && end_date) {
            this.whereBetween(between_date, [
              moment(start_date)
                .startOf("day")
                .format("YYYY-MM-DD HH:mm:ss"),
              moment(end_date)
                .endOf("day")
                .format("YYYY-MM-DD HH:mm:ss"),
            ])
          }
        })
        .orderBy(sort_by, sort_mode)
        .paginate(page, limit)

      let parsed = ResponseParser.apiCollection(data.toJSON())

      if (!search || search == "") {
        await RedisHelper.set("OnlineProductOrder_" + redisKey, parsed)
      }
      return response.status(200).send(parsed)
    } catch (e) {
      console.log("e", e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async review({ request, response }) {
    const { orderData } = await this.countOrder(request, response)
    return response.status(200).send(ResponseParser.apiItem(orderData))
  }

  async store({ request, response }) {
    try {
      const { orderData, referralData } = await this.countOrder(
        request,
        response
      )
      const newOrder = await OnlineProductOrder.create(orderData)
      // Update referral by fill in customer info
      if (referralData) {
        const body = request.only(fillable)
        const consumer = {
          id: newOrder.order_no,
          email: body.email,
          date: new Date(),
          other: JSON.stringify(body),
        }
        ReferralTrait.update(referralData._id, { consumer: [consumer] })
      }

      RedisHelper.delete("OnlineProductOrder_*")

      return response.status(201).send(ResponseParser.apiCreated(newOrder))
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async countOrder(request, response) {
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

    // generate order
    const orderData = {
      order_no: Math.floor(Date.now() / 1000).toString(),
      status: orderStatus.WAITING_FOR_PAYMENT,
      name: body.name,
      email: body.email,
      phone: body.phone,
      university: body.university,
      device_id: body.device_id,
      referral: undefined,
      marketing_id: undefined,
      product_id: product.id,
      price: product.price,
    }

    if (referralData && !referralData.isExpired) {
      orderData.price = product.discount_price
      orderData.marketing_id = parseInt(referralData.creator.id)
      orderData.referral = referralData.code
    }

    return { orderData, referralData }
  }

  async update({ request, response, auth }) {
    try {
      const fillable = [
        "name",
        "email",
        "phone",
        "university",
        "referral",
        "status",
        "marketing_id",
        "product_id",
      ]
      let body = request.only(fillable)
      const id = request.params.id
      const data = await OnlineProductOrder.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      data.merge(body)
      await data.save()
      const activity = `Update OnlineProductOrder '${data.order_no}'`
      ActivityTraits.saveActivity(request, auth, activity)
      RedisHelper.delete("OnlineProductOrder_*")
      await data.loadMany(["marketing", "product"])

      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      console.log("e", e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `OnlineProductOrder_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await OnlineProductOrder.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.loadMany(["marketing", "product"])
      let parsed = ResponseParser.apiItem(data.toJSON())
      await RedisHelper.set(redisKey, parsed)
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async getByOrderNo({ request, response }) {
    try {
      const { order_no, device_id } = request.params
      if (!order_no || !device_id) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      let order = await OnlineProductOrder.query()
        .where("order_no", order_no)
        .where("device_id", device_id)
        .first()

      if (!order) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }

      if (order.status === orderStatus.WAITING_FOR_PAYMENT) {
        const resp = await Midtrans.getOrder(order.order_no)
        console.log("resp.status_code", resp.status_code)
        const successStatus = ["200", "201"]
        if (!successStatus.includes(resp.status_code)) {
          order.status = orderStatus.PAYMENT_FAILED
          await order.save()
        }
        order = await Midtrans.statusActions(resp, order)
      }

      return response.status(200).send(ResponseParser.apiItem(order.toJSON()))
    } catch (e) {
      console.log("e", e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async activate({ request, response }) {
    try {
      const { device_id, activation_code, order_no } = request.post()
      if (!activation_code) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      const order = await OnlineProductOrder.query()
        .where(function() {
          this.where("activation_code", activation_code)
          if (device_id) {
            this.where("device_id", device_id)
          }
          if (order_no) {
            this.where("order_no", order_no)
          }
          this.where("status", "COMPLETED")
        })
        .first()

      if (!order) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }

      order.is_disabled = false
      await order.save()

      return response.status(200).send(ResponseParser.apiItem(order.toJSON()))
    } catch (e) {
      console.log("e", e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await OnlineProductOrder.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }

      const activity = `Delete OnlineProductOrder '${data.order_no}'`
      Promise.all([
        ActivityTraits.saveActivity(request, auth, activity),
        RedisHelper.delete("OnlineProductOrder_*"),
        data.delete(),
      ])
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      console.log("e", e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async revenue({ request, response, auth }) {
    try {
      const { start_date, end_date, marketing_id } = request.get()
      const user = await auth.getUser()
      const roles = await user.getRoles()
      let revenue = 0
      const orders = await OnlineProductOrder.query()
        .where(function() {
          if (roles.includes("marketing")) {
            this.where("marketing_id", user.id)
          }
          if (marketing_id) {
            this.where("marketing_id", marketing_id)
          }
          this.whereBetween("paid_at", [
            moment(start_date)
              .startOf("day")
              .toDate(),
            moment(end_date)
              .endOf("day")
              .toDate(),
          ])
        })
        .sum("price as revenue")

      if (orders && orders[0].revenue) {
        revenue = orders[0].revenue
      }
      return response.status(200).send(ResponseParser.apiItem({ revenue }))
    } catch (e) {
      console.log("e", e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = OnlineProductOrderController
