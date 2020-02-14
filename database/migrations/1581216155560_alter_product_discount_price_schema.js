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
  }

  down() {
    this.alter("products", table => {
      table.dropColumn("discount_price")
    })
  }
}

module.exports = AlterProductDiscountPriceSchema
