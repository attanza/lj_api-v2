"use strict"

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model")

class OnlineProductOrder extends Model {
  static get dates() {
    return super.dates.concat(["paid_at"])
  }
  marketing() {
    return this.belongsTo("App/Models/User", "marketing_id")
  }
  product() {
    return this.belongsTo("App/Models/Product")
  }
}

module.exports = OnlineProductOrder
