"use strict"

const PaymentMethod = use("App/Models/PaymentMethod")

class PaymentMethodSeeder {
  async run() {
    await PaymentMethod.truncate()
    const methods = ["Midtrans", "Xendit"]
    for (let i = 0; i < methods.length; i++) {
      await PaymentMethod.create({
        name: methods[i],
      })
    }
  }
}

module.exports = PaymentMethodSeeder
