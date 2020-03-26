"use strict"

const Env = use("Env")

const mailjet = require("node-mailjet").connect(
  Env.get("MAILJET_KEY"),
  Env.get("MAILJET_SECRET")
)

module.exports = ctx => {
  const { name, email, subject, content } = ctx
  const request = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "noreply@m3yapindo.com",
          Name: "Yapindo Jaya Abadi",
        },
        To: [
          {
            Email: email,
            Name: name,
          },
        ],
        Subject: subject,
        HTMLPart: content,
      },
    ],
  })
  request
    .then(result => {
      console.log(result.body)
    })
    .catch(err => {
      console.log(err.statusCode)
    })
}
