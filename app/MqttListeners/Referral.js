"use strict"

const MqttListener = use("MqttListener")
const { RedisHelper } = use("App/Helpers")
class Test extends MqttListener {
  /**
   * This is the subscription string the listener is listening to.
   *
   * @returns {string}
   */
  get subscription() {
    return "referral/#"
  }

  /**
   * Message handler. Do what you want with your MQTT message here.
   *
   * @param {String} message Data of the message
   * @param {String[]} wildcardMatches Wildcard matches in your subscription string
   */
  async handleMessage(message, wildcardMatches) {
    if (wildcardMatches.includes("checkExpiry")) {
      console.log("clear referral cache")
      await RedisHelper.delete("Referral_*")
    }
  }
}

module.exports = Test
