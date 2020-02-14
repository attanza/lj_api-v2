'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ReferralSchema extends Schema {
  up () {
    this.create('referrals', (table) => {
      table.increments()
      table.integer("marketing_id").unsigned().index()
      table.integer("harga").unsigned()
      table.integer("harga_discount").unsigned()
      table.integer("study_program_id").unsigned().index()
      table.string("referral_code")
      table.string("description")
      table.timestamps()
    })
  }

  down () {
    this.drop('referrals')
  }
}

module.exports = ReferralSchema
