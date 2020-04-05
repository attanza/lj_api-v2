"use strict"

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema")

class AlterProductDiscountPriceSchema extends Schema {
  up() {
    this.alter("products", table => {
      table
        .decimal("price", 10, 2)
        .after("measurement")
        .alter()
      table.decimal("discount_price", 10, 2).after("price")
    })
    this.alter("dashboards", table => {
      table.integer("total_orders").after("total_products")
    })
  }

  down() {
    this.alter("products", table => {
      table.dropColumn("discount_price")
    })
    this.alter("dashboards", table => {
      table.dropColumn("total_orders")
    })
  }
}

module.exports = AlterProductDiscountPriceSchema
