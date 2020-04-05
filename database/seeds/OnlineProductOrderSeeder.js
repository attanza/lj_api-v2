"use strict"

const Factory = use("Factory")
const OnlineProductOrder = use("App/Models/OnlineProductOrder")
const User = use("App/Models/User")
const Product = use("App/Models/Product")
const axios = require("axios")
const Chance = require("chance")
const Env = use("Env")
const REFERRAL_API = Env.get("REFERRAL_API")
const moment = require("moment")

class OnlineProductOrderSeeder {
  async run() {
    try {
      await OnlineProductOrder.truncate()
      // await Factory.model("App/Models/OnlineProductOrder").createMany(100)
      const faker = new Chance()

      const users = await User.query().whereIn("id", [6, 7, 8]).fetch()
      const marketings = users.toJSON()

      const productsDb = await Product.query().select("id", "name").fetch()
      const jsonProducts = productsDb.toJSON()
      for (let j = 0; j < 100; j++) {
        // Creator
        const randomMarketing = faker.integer({ min: 0, max: 2 })
        const creator = {
          id: marketings[randomMarketing].id.toString(),
          email: marketings[randomMarketing].email,
        }

        // Products
        const products = []
        for (let k = 0; k < faker.integer({ min: 2, max: 10 }); k++) {
          const selectedProduct =
            jsonProducts[faker.integer({ min: 0, max: 2 })]
          products.push({
            id: selectedProduct.id,
            name: selectedProduct.name,
          })
        }

        // Consumers
        const consumers = []
        for (let i = 0; i < faker.integer({ min: 1, max: 5 }); i++) {
          consumers.push({
            email: faker.email(),
            date: faker.date({ year: 2020 }),
            other: JSON.stringify({
              university: faker.company(),
              name: faker.name(),
            }),
          })
        }

        // Referrals
        const referral = {
          code: faker.bb_pin(),
          creator: creator,
          consumer: consumers,
          products,
          validUntil: moment().add(1, "day").toDate(),
        }
        await axios.post(REFERRAL_API + "/referrals", referral)

        // Orders
        const orders = []
        consumers.map((c) => {
          const other = JSON.parse(c.other)
          orders.push({
            order_no: faker.bb_pin(),
            name: other.name,
            email: c.email,
            phone: c.phon,
            university: other.university,
            device_id: faker.bb_pin(),
            referral: referral.code,
            status: "COMPLETED",
            price: faker.integer({ min: 100000, max: 250000 }),
            marketing_id: creator.id,
            product_id: faker.integer({ min: 1, max: 3 }),
            paid_at: faker.date({ year: 2020 }),
            device_id: faker.android_id(),
            activation_code: faker.string({
              length: 12,
              casing: "lower",
              alpha: true,
              numeric: true,
            }),
            is_disabled: false,
          })
        })

        await OnlineProductOrder.createMany(orders)
      }
    } catch (e) {
      console.log("e", e)
    }
  }
}

module.exports = OnlineProductOrderSeeder
// order_no: faker.bb_pin(),
// name: faker.name(),
// email: faker.email(),
// phone: faker.phone(),
// university: faker.company(),
// device_id: faker.bb_pin(),
// status: "COMPLETED",
// price: faker.integer({ min: 100000, max: 250000 }),
// marketing_id: faker.integer({ min: 6, max: 8 }),
// product_id: faker.integer({ min: 1, max: 3 }),
// paid_at: faker.date({ year: 2020 }),
// device_id: faker.android_id(),
// activation_code: faker.string({ length: 12, casing: "lower" }),
// is_disabled: false,

// {
//   "creator": {
//       "id": "8",
//       "email": "vu@mudnope.iq"
//   },
//   "isExpired": false,
//   "code": "cd479b67",
//   "description": "Egi ric kidi reczu ejselcec famra rakiik jihvibid iliij ukpe maklas lub fauja pif gatteh fopfuljo en rufwo."
// }
