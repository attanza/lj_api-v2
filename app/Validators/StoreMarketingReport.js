'use strict'

const messages = require('./messages')

class StoreMarketingReport {
  get rules() {
    return {
      code: 'max:20|unique:marketing_reports',
      schedulle_id: 'required|integer',
      method: 'string|max:50',
      date: 'date',
      terms: 'string|max:1000',
      result: 'string|max:1000',
      note: 'string|max:250',
      lat: 'number',
      lng: 'number',
      description: 'string|max:1000'
    }
  }

  get messages() {
    return messages
  }

  get sanitizationRules() {
    return {
      code: 'escape',
      schedulle_id: 'toInt',
      method: 'escape',
      date: 'toDate',
      terms: 'escape',
      result: 'escape',
      description: 'escape',
      note: 'escape',
    }
  }
}

module.exports = StoreMarketingReport
