"use strict"

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema")

class OnlineProductOrderSchema extends Schema {
  up() {
    this.create("online_product_orders", table => {
      table.increments()
      table
        .string("order_no", 20)
        .unique()
        .index()
      table.string("payment_with", 50)
      table.string("name", 50)
      table.string("email", 250).index()
      table.string("phone", 30).index()
      table.string("university", 150)
      table.string("referral", 50).index()
      table.string("status", 25).index()
      table.integer("price")
      table.text("payment_detail").nullable()
      table
        .integer("marketing_id")
        .unsigned()
        .index()
      table
        .integer("product_id")
        .unsigned()
        .index()
      table.string("activation_code", 20).index()
      table.string("device_id", 250).index()
      table.boolean("is_disabled").default(true)
      table.dateTime("paid_at")
      table.timestamps()
    })
  }

  down() {
    this.drop("online_product_orders")
  }
}

module.exports = OnlineProductOrderSchema
