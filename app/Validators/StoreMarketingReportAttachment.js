'use strict'

const { ResponseParser } = use('App/Helpers')
const messages = require('./messages')

class StoreMarketingReportAttachment {
  get rules() {
    return {
      marketing_target_id: 'required',
      caption: 'string|max:50',
      tags: 'string|max:50',
      url: 'string'
    }
  }

  get messages() {
    return messages
  }

  get sanitizationRules() {
    return {
      caption: 'escape',
      tags: 'escape',
    }
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(ResponseParser.apiValidationFailed(errorMessages))
  }
}

module.exports = StoreMarketingReportAttachment
