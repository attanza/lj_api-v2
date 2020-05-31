const Event = use("Event")
const Mqtt = use("Mqtt")

// Listen to some Events of the library
Event.on("MQTT:Connected", () => {
  console.log("MQTT CONNECTED")
})
Event.on("MQTT:Disconnected", () => {
  console.log("MQTT disconnected")
})
