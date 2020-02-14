'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UpdateDownPaymentsSchema extends Schema {
  up() {
    this.table('down_payments', (table) => {
      table.string("kelas", 50)
      table.string("produk", 50)
      table.integer("harga")
    })
  }

  down() {
    this.table('down_payments', (table) => {
      // reverse alternations
    })
  }
}

module.exports = UpdateDownPaymentsSchema
