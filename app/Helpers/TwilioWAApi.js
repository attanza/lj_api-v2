const Env = use("Env");
const twilio = require("twilio");

const accountSid = Env.get("TWILIO_ACCOUNT");
const authToken = Env.get("TWILIO_TOKEN");
const wanumber = Env.get("TWILIO_WA_NUMBER");

function sendWhatsappMessage(userPhone, body) {
  const client = new twilio(accountSid, authToken);
  client.messages
    .create({
      body,
      from: "whatsapp:+62817130682",
      to: "whatsapp:" + userPhone
    })
    .then(message => {
      console.log("------------------------");
      console.log("Sms Api");
      console.log(message.accountSid);
      console.log(message.to);
      console.log(message.body);
      console.log("------------------------");
    })
    .catch(e => console.log(e));
}

module.exports = sendWhatsappMessage;
