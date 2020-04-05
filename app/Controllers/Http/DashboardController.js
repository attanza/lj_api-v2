"use strict"

const Dashboard = use("App/Models/Dashboard")
const { RedisHelper } = use("App/Helpers")
const User = use("App/Models/User")
const Product = use("App/Models/Product")
const University = use("App/Models/University")
const OnlineProductOrder = use("App/Models/OnlineProductOrder")
const Order = use("App/Models/OnlineProductOrder")
const Database = use("Database")
const moment = require("moment")
class DashboardController {
  async index({ response }) {
    const redisKey = "Dashboard_Data"
    const cached = await RedisHelper.get(redisKey)
    if (cached) {
      return response.status(200).send(cached)
    }

    const dashboard = await this.storeDashboardData()
    await RedisHelper.set(redisKey, dashboard)
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

    // Online Orders
    const startYear = moment()
      .startOf("year")
      .format("YYYY-MM-DD HH:mm:ss")
    const endYear = moment()
      .endOf("year")
      .format("YYYY-MM-DD HH:mm:ss")

    const totalOrders = await OnlineProductOrder.query()
      .whereBetween("paid_at", [startYear, endYear])
      .count("* as total")

    const onlineOrders = await Order.query()
      .select(Database.raw("sum(price) as total, MONTH(paid_at) as month"))
      .groupBy("month")
      .whereBetween("paid_at", [startYear, endYear])
      .where("is_disabled", false)
      .orderBy("month")
      .fetch()

    const dashboardDetails = {
      total_marketings: totalMarketings[0].total,
      total_products: totalProducts[0].total,
      total_universities: totalUniversities[0].total,
      total_orders: totalOrders[0].total,
    }

    const dashboard = await Dashboard.first()
    dashboard.merge(dashboardDetails)
    await dashboard.save()

    const redisKey = "Dashboard_Data"
    await RedisHelper.delete(redisKey)
    const jsonDashboard = dashboard.toJSON()
    return { ...jsonDashboard, onlineOrders: onlineOrders.toJSON() }
  }
}

module.exports = DashboardController
