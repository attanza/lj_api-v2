"use strict"

const Dashboard = use("App/Models/Dashboard")
const { RedisHelper } = use("App/Helpers")
const User = use("App/Models/User")
const Product = use("App/Models/Product")
const University = use("App/Models/University")
const Order = use("App/Models/OnlineProductOrder")
const Database = use("Database")
class DashboardController {
  async index({ response }) {
    const redisKey = "Dashboard_Data"
    // const cached = await RedisHelper.get(redisKey)
    // if (cached) {
    //   return response.status(200).send(cached)
    // }

    const dashboard = await this.storeDashboardData()
    // await RedisHelper.set(redisKey, dashboard)
    return response.status(200).send(dashboard)
  }

  async store({ response }) {
    const dashboard = await this.storeDashboardData()
    return response.status(200).send(dashboard)
  }

  async storeDashboardData() {
    // Total Marketings
    const totalMarketings = await User.query()
      .whereHas("roles", builder => {
        builder.where("slug", "marketing")
      })
      .where("is_active", 1)
      .count("* as total")

    // Total Products
    const totalProducts = await Product.query().count("* as total")

    // Total Universities
    const totalUniversities = await University.query().count("* as total")

    // Orders
    const orders = await Database.raw(
      "select id, price, YEAR(date), MONTH(date) from online_product_orders GROUP BY YEAR(date)"
    )
    console.log("orders", JSON.stringify(orders))

    const dashboardDetails = {
      total_marketings: totalMarketings[0].total,
      total_products: totalProducts[0].total,
      total_universities: totalUniversities[0].total,
    }

    const dashboard = await Dashboard.first()
    dashboard.merge(dashboardDetails)
    await dashboard.save()

    const redisKey = "Dashboard_Data"
    await RedisHelper.delete(redisKey)
    return dashboard
  }
}

module.exports = DashboardController
