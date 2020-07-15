"use strict"

const Product = use("App/Models/Product")
const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits, ReferralTrait } = use("App/Traits")
const fillable = [
  "code",
  "name",
  "measurement",
  "price",
  "discount_price",
  "description",
]
/**
 * ProductController
 *
 */

class ProductController {
  /**
   * Index
   * Get List of Products
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `Product_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        return cached
      }

      const data = await Product.query()
        .where(function() {
          if (q.search && q.search != "") {
            this.where("code", "like", `%${q.search}%`)
            this.orWhere("name", "like", `%${q.search}%`)
            this.orWhere("measurement", "like", `%${q.search}%`)
            this.orWhere("price", "like", `%${q.search}%`)
            this.orWhere("discount_price", "like", `%${q.search}%`)
          }

          if (q.search_by && q.search_query) {
            this.where(q.search_by, q.search_query)
          }

          if (q.between_date && q.start_date && q.end_date) {
            this.whereBetween(q.between_date, [q.start_date, q.end_date])
          }
        })
        .orderBy(q.sort_by, q.sort_mode)
        .paginate(q.page, q.limit)

      let parsed = ResponseParser.apiCollection(data.toJSON())

      if (!q.search || q.search == "") {
        await RedisHelper.set(redisKey, parsed)
      }
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Store
   * Store New Products
   * Can only be done by Super Administrator
   */
  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const data = await Product.create(body)
      await RedisHelper.delete("Product_*")
      await RedisHelper.delete("Dashboard_Data")
      const activity = `Add new Product '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      let parsed = ResponseParser.apiCreated(data.toJSON())
      return response.status(201).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Show
   * Product by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `Product_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await Product.query()
        .where("id", id)
        .orWhere("code", id)
        .first()
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      let parsed = ResponseParser.apiItem(data.toJSON())
      await RedisHelper.set(redisKey, parsed)
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Update
   * Update Product by Id
   * Can only be done by Super Administrator
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await Product.find(id)
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.merge(body)
      await data.save()
      const activity = `Update Product '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("Product_*")
      await RedisHelper.delete("Dashboard_Data")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete Product by Id
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await Product.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      const activity = `Delete Product '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("Product_*")
      await RedisHelper.delete("Dashboard_Data")
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async getPrice({ request, response }) {
    try {
      const { code } = request.params
      const product = await Product.query()
        .where("id", code)
        .orWhere("code", code)
        .first()
      if (!product) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      const { referral } = request.get()
      if (referral && referral !== "") {
        const isExists = await ReferralTrait.check(referral)
        if (isExists) {
          return response
            .status(200)
            .send(ResponseParser.apiItem(product.discount_price))
        }
      }
      return response.status(200).send(ResponseParser.apiItem(product.price))
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = ProductController
