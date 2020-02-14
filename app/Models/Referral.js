'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Referral extends Model {
  static get dates() {
    return super.dates.concat(['date'])
  }

  marketing() {
    return this.belongsTo('App/Models/User', 'marketing_id')
  }

  study_program(){
    return this.belongsTo('App/Models/StudyProgram','study_program_id')
  }

}

module.exports = Referral
