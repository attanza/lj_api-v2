"use strict"

const Factory = use("Factory")
const OnlineProductOrder = use("App/Models/OnlineProductOrder")
class OnlineProductOrderSeeder {
  async run() {
    await OnlineProductOrder.truncate()
    await Factory.model("App/Models/OnlineProductOrder").createMany(100)
  }
}

module.exports = OnlineProductOrderSeeder
