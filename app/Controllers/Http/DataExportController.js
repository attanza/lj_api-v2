'use strict'

const { ResponseParser } = use('App/Helpers')
const changeCase = require('change-case')
const User = use('App/Models/User')
const University = use('App/Models/University')
const StudyProgram = use('App/Models/StudyProgram')
const StudyName = use('App/Models/StudyName')
const Role = use('App/Models/Role')
const MarketingAction = use('App/Models/MarketingAction')
const Permission = use('App/Models/Permission')
const Product = use('App/Models/Product')
const Activity = use('App/Models/Activity')
const Schedulle = use('App/Models/Schedulle')
const MarketingTargetContact = use('App/Models/MarketingTargetContact')
const DownPayment = use('App/Models/DownPayment.js'
)
const moment = require('moment')

class DataExportController {
  async index({ request, response }) {
    try {
      let { model, sort_by, sort_mode, limit, range_by, range_start, range_end, user_id, marketing_id, marketing_target_id } = request.get()

      if (!sort_by) sort_by = 'id'
      if (!sort_mode) sort_mode = 'asc'
      if (!limit) limit = 100
      if (!range_by) range_by = 'created_at'
      if (!range_start) range_start = moment().add(-1, 'M').format('YYYY-MM-DD HH:mm:ss')
      else range_start = moment(range_start).format('YYYY-MM-DD HH:mm:ss')
      if (!range_end) range_end = moment().format('YYYY-MM-DD HH:mm:ss')
      else range_end = moment(range_end).format('YYYY-MM-DD HH:mm:ss')

      model = changeCase.upperCaseFirst(model)
      let data

      switch (model) {
        case 'User':
          data = await this.getUsers(sort_by, sort_mode, limit, range_by, range_start, range_end)
          break

        case 'University':
          data = await this.getUniversities(sort_by, sort_mode, limit, range_by, range_start, range_end)
          break

        case 'Supervisor':
          data = await this.getSupervisor(sort_by, sort_mode, limit, range_by, range_start, range_end)
          break

        case 'Marketing':
          data = await this.getMarketing(sort_by, sort_mode, limit, range_by, range_start, range_end)
          break

        case 'StudyProgram':
          data = await this.getStudyPrograms(sort_by, sort_mode, limit, range_by, range_start, range_end)
          break

        case 'StudyName':
          data = await this.getStudyNames(sort_by, sort_mode, limit, range_by, range_start, range_end)
          break

        case 'MarketingAction':
          data = await this.getMarketingActions(sort_by, sort_mode, limit, range_by, range_start, range_end)
          break

        case 'Role':
          data = await this.getRoles(sort_by, sort_mode, limit, range_by, range_start, range_end)
          break

        case 'Permission':
          data = await this.getPermissions(sort_by, sort_mode, limit, range_by, range_start, range_end)
          break

        case 'Product':
          data = await this.getProducts(sort_by, sort_mode, limit, range_by, range_start, range_end)
          break

        case 'Activity':
          data = await this.getActivities(sort_by, sort_mode, limit, range_by, range_start, range_end, user_id)
          break

        case 'Schedulle':
          data = await this.getSchedulles(sort_by, sort_mode, limit, range_by, range_start, range_end, marketing_id)
          break

        case 'Contact':
          data = await this.getContacts(sort_by, sort_mode, limit, range_by, range_start, range_end, marketing_target_id)
          break
        case 'DownPayment':
          data = await this.getDownPayments(sort_by, sort_mode, limit, range_by, range_start, range_end)
          break

        default:
          data = null
          break
      }

      return response.status(200).send(ResponseParser.apiItem(data))
    } catch (error) {
      console.log("error", error); //eslint-disable-line
      return response
        .status(400)
        .send(ResponseParser.errorResponse('Failed to get data'))
    }
  }

  async getUsers(sort_by, sort_mode, limit, range_by, range_start, range_end) {
    let dbData = await User.query()
      .with('roles', builder => {
        builder.select('id', 'name')
      })
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()

    dbData = dbData.toJSON()
    let output = []
    dbData.map(d => {
      // Roles Parsing
      let roles = ''
      let data = Object.assign({}, d)
      delete data.roles
      if (d.roles) d.roles.map(role => (roles += role.name + ', '))
      data.roles = roles

      output.push(data)
    })
    return output
  }

  async getUniversities(sort_by, sort_mode, limit, range_by, range_start, range_end) {
    let dbData = await University.query()
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()
    return dbData
  }

  async getDownPayments(sort_by, sort_mode, limit, range_by, range_start, range_end) {
    let dbData = await DownPayment.query()
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()
    return dbData
  }

  async getSupervisor(sort_by, sort_mode, limit, range_by, range_start, range_end) {
    let dbData = await User.query()
      .whereHas('roles', builder => {
        builder.where('slug', 'supervisor')
      })
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()

    return dbData
  }

  async getMarketing(sort_by, sort_mode, limit, range_by, range_start, range_end) {
    let dbData = await User.query()
      .whereHas('roles', builder => {
        builder.where('slug', 'marketing')
      })
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()

    return dbData
  }

  async getStudyPrograms(sort_by, sort_mode, limit, range_by, range_start, range_end) {
    let dbData = await StudyProgram.query()
      .with('university')
      .with('studyName')
      .with('years')
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()

    dbData = dbData.toJSON()
    let output = []
    dbData.forEach(data => {
      let d = Object.assign({}, data)
      if (d.university) delete d.university
      if (data.university) d.university = data.university.name

      if (d.studyName) delete d.studyName
      if (data.studyName) d.studyName = data.studyName.name

      if (d.years) delete d.years
      let years = ''
      if (data.years) {
        data.years.map(y => {
          let year = ''
          year += `[year: ${y.year}, class_per_year: ${y.class_per_year}, students_per_class: ${y.students_per_class}], `
          years += year
        })
      }
      d.years = years

      output.push(d)
    })
    return output
  }

  async getStudyNames(sort_by, sort_mode, limit, range_by, range_start, range_end) {
    let dbData = await StudyName.query()
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()
    return dbData
  }

  async getMarketingActions(sort_by, sort_mode, limit, range_by, range_start, range_end) {
    let dbData = await MarketingAction.query()
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()
    return dbData
  }

  async getRoles(sort_by, sort_mode, limit, range_by, range_start, range_end) {
    let dbData = await Role.query()
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()
    return dbData
  }

  async getPermissions(sort_by, sort_mode, limit, range_by, range_start, range_end) {
    let dbData = await Permission.query()
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()
    return dbData
  }

  async getProducts(sort_by, sort_mode, limit, range_by, range_start, range_end) {
    let dbData = await Product.query()
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()
    return dbData
  }

  async getActivities(sort_by, sort_mode, limit, range_by, range_start, range_end, user_id) {
    let dbData = await Activity.query()
      .with('user', builder => {
        builder.select('id', 'name')
      })
      .where(function () {
        if (user_id) {
          return this.where(user_id, 'user_id')
        }
      })
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()
    dbData = dbData.toJSON()
    let output = []
    dbData.forEach(data => {
      let d = Object.assign({}, data)
      delete d.user
      delete d.user_id
      if (data.user) d.user = data.user.name
      output.push(d)
    })
    return output
  }

  async getSchedulles(sort_by, sort_mode, limit, range_by, range_start, range_end, marketing_id) {
    let dbData = await Schedulle.query()
      .with('marketing', builder => {
        builder.select('id', 'name')
      })
      .with('study.university')
      .with('study.studyName')
      .with('action', builder => {
        builder.select('id', 'name')
      })
      .where(function () {
        if (marketing_id) {
          return this.where(marketing_id, 'marketing_id')
        }
      })
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()
    dbData = dbData.toJSON()
    let output = []
    dbData.forEach(data => {
      let d = Object.assign({}, data)

      // Schedulle Marketing
      delete d.marketing
      delete d.marketing_id
      if (data.marketing) d.marketing = data.marketing.name

      // Add University Data
      d.university = data.study.university.name

      // Schedulle Study Program
      delete d.study
      delete d.study_id
      if (data.study) d.study = data.study.studyName.name

      // Schedulle Study Program
      delete d.action
      delete d.marketing_action_id
      if (data.action) d.action = data.action.name

      // Add Address Data
      d.address = data.study.address

      output.push(d)
    })
    return output
  }

  async getContacts(sort_by, sort_mode, limit, range_by, range_start, range_end, marketing_target_id) {
    let dbData = await MarketingTargetContact.query()
      .with('target', builder => {
        builder.select('id', 'code')
      })
      .where(function () {
        if (marketing_target_id && marketing_target_id != '') {
          return this.where('marketing_target_id', marketing_target_id)
        }
      })
      .whereBetween(range_by, [range_start, range_end])
      .orderBy(sort_by, sort_mode)
      .limit(parseInt(limit))
      .fetch()
    dbData = dbData.toJSON()
    let output = []
    dbData.forEach(data => {
      let d = Object.assign({}, data)

      // Schedulle Marketing
      delete d.target
      delete d.marketing_target_id
      if (data.target) d.target = data.target.code

      output.push(d)
    })
    return output
  }
}

module.exports = DataExportController
