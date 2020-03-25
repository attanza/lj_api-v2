"use strict"
const nodemailer = require("nodemailer")
const Env = use("Env")
const Email = require("email-templates")
const path = require("path")
class NodeMailer {
  constructor() {}

  getTransport() {
    return nodemailer.createTransport({
      host: Env.get("MAIL_HOST"),
      port: Env.get("MAIL_PORT"),
      secure: true,
      auth: {
        user: Env.get("MAIL_USERNAME"), // generated ethereal user
        pass: Env.get("MAIL_PASSWORD"), // generated ethereal password
      },
    })
  }

  getMail() {
    return new Email({
      message: {
        from: Env.get("MAIL_FROM"),
      },
      // uncomment below to send emails in development/test env:
      send: true,
      transport: this.getTransport(),
      views: {
        root: "resources/views/emails",
      },
    })
  }

  async sendMail({ to, subject, template, data }) {
    const email = this.getMail()
    email
      .send({
        template,
        message: {
          subject,
          to,
        },
        locals: {
          ...data,
        },
      })
      .then(() => console.log("Mail sent"))
      .catch(console.error)
  }
}

module.exports = new NodeMailer()
