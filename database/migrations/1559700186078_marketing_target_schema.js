'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MarketingTargetSchema extends Schema {
  up() {
    this.table('marketing_targets', (table) => {
      table.string('angkatan', 10);
    })
  }

  down() {
    this.table('marketing_targets', (table) => {
      // reverse alternations
    })
  }
}

module.exports = MarketingTargetSchema
