"use strict"

const { ResponseParser, ErrorLog, RedisHelper, GetRequestQuery } = use(
  "App/Helpers"
)
const ProductActivator = use("App/Models/ProductActivator")
const { ActivityTraits } = use("App/Traits")

const fillable = ["order_id", "code", "device_id", "expired_at", "isActive"]

class ProductActivatorController {
  async index({ request, response }) {
    try {
      const query = GetRequestQuery(request)
      const { redisKey } = query
      const cache = await RedisHelper.get("ProductActivator" + redisKey)
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
      const regexSearchKeys = ["code", "order_id"]
      const searchKeys = ["order_id", "code", "isActive"]
      const data = await ProductActivator.query()
        .with("order", builder => {
          builder.select("id", "order_no")
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
            this.whereBetween(between_date, [start_date, end_date])
          }
        })
        .orderBy(sort_by, sort_mode)
        .paginate(page, limit)

      let parsed = ResponseParser.apiCollection(data.toJSON())

      if (!search || search == "") {
        await RedisHelper.set("ProductActivator_" + redisKey, parsed)
      }
      return response.status(200).send(parsed)
    } catch (e) {
      console.log("e", e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const data = await ProductActivator.create(body)
      await RedisHelper.delete("ProductActivator_*")
      const activity = `Add new ProductActivator '${data.code}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      let parsed = ResponseParser.apiCreated(data.toJSON())
      return response.status(201).send(parsed)
    } catch (e) {
      console.log("e", e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await ProductActivator.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      data.merge(body)
      await data.save()
      const activity = `Update ProductActivator '${data.code}'`
      ActivityTraits.saveActivity(request, auth, activity)
      RedisHelper.delete("ProductActivator_*")
      await data.load("order")

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
      let redisKey = `ProductActivator_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await ProductActivator.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.load("order")
      let parsed = ResponseParser.apiItem(data.toJSON())
      await RedisHelper.set(redisKey, parsed)
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await ProductActivator.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }

      const activity = `Delete ProductActivator '${data.order_no}'`
      Promise.all([
        ActivityTraits.saveActivity(request, auth, activity),
        RedisHelper.delete("ProductActivator_*"),
        data.delete(),
      ])
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async activate({ request, response }) {
    try {
      const { code, device_id } = request.post()
      const activator = await ProductActivator.findBy("code", code)
      if (!activator) {
        return response
          .status(400)
          .send(ResponseParser.errorResponse("Activation failed"))
      }
      if (activator.device_id !== device_id) {
        return response
          .status(400)
          .send(ResponseParser.errorResponse("Activation failed"))
      }
      activator.isActive = true
      await activator.save()
      return response
        .status(200)
        .send(ResponseParser.successResponse(null, "Activation succeed"))
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async check({ request, response }) {
    try {
      const { code, device_id, product } = request.get()
      if (!code || !device_id) {
        return response.status(200).send({ active: false })
      }
      const activator = await ProductActivator.findBy("code", code)
      if (!activator) {
        return response.status(200).send({ active: false })
      }
      if (activator.device_id !== device_id) {
        return response.status(200).send({ active: false })
      }
      await activator.load("order.product")
      const activatorJson = activator.toJSON()
      if (activatorJson.order.product.code !== product) {
        return response.status(200).send({ active: false })
      }
      return response.status(200).send({ active: true })
    } catch (e) {
      console.log("e", e)
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = ProductActivatorController
