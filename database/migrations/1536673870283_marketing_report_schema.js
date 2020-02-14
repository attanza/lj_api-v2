"use strict"

const Schema = use("Schema")

class MarketingReportSchema extends Schema {
  up() {
    this.create("marketing_reports", table => {
      table.increments()
      table
        .string("code", 20)
        .notNullable()
        .unique()
        .index()
      table
        .integer("schedulle_id")
        .unsigned()
        .index()
      table.string("method", 50)
      table.dateTime("date").notNullable()
      table.text("terms")
      table.text("result")
      table.string("note")
      table.float("lat", 10, 6).default(-6.17511)
      table.float("lng", 10, 6).default(106.865036)
      table.text("description")
      table.timestamps()
    })
  }

  down() {
    this.drop("marketing_reports")
  }
}

module.exports = MarketingReportSchema
