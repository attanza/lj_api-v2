"use strict"

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model")

class ProductActivator extends Model {
  order() {
    return this.belongsTo("App/Models/OnlineProductOrder", "order_id")
  }
}

module.exports = ProductActivator
