"use strict"

const docs = require("../../../docs.json")

class DocumentController {
  async index({ view }) {
    return view.render("docs2.index", {
      docs,
    })
  }

  async intro({ view }) {
    return view.render("intro")
  }

  async onlineOrderFlow({ view }) {
    return view.render("onlineProductOrder")
  }
}

module.exports = DocumentController
