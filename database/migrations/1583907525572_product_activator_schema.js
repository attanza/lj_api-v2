"use strict"

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema")

class ProductActivatorSchema extends Schema {
  up() {
    this.create("product_activators", table => {
      table.increments()
      table
        .integer("order_id")
        .unsigned()
        .index()
      table.string("code", 20).index()
      table.string("device_id", 30)
      table.dateTime("expired_at").nullable()
      table.boolean("isActive").default(true)
      table.timestamps()
    })
  }

  down() {
    this.drop("product_activators")
  }
}

module.exports = ProductActivatorSchema
