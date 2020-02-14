"use strict"

const StudyYear = use("App/Models/StudyYear")
const { RedisHelper, ResponseParser, ErrorLog } = use("App/Helpers")
const { ActivityTraits } = use("App/Traits")
const fillable = [
  "study_program_id",
  "year",
  "class_per_year",
  "students_per_class",
]
const yearUniqueFailed = [
  {
    message: "Year is already exist",
    field: "year",
    validation: "unique",
  },
]
/**
 * StudyYearController
 *
 */

class StudyYearController {
  /**
   * Index
   * Get List of StudyYears
   */
  async index({ request, response }) {
    try {
      let {
        page,
        limit,
        search,
        search_by,
        search_query,
        between_date,
        start_date,
        end_date,
        sort_by,
        sort_mode,
        study_program_id,
      } = request.get()

      if (!page) page = 1
      if (!limit) limit = 50
      if (!sort_by) sort_by = "id"
      if (!sort_mode) sort_mode = "desc"

      const redisKey = `StudyYear_${page}${limit}${sort_by}${sort_mode}${search_by}${search_query}${between_date}${start_date}${end_date}${study_program_id}`

      let cached = await RedisHelper.get(redisKey)

      if (cached && !search) {
        return cached
      }

      const data = await StudyYear.query()
        .where(function() {
          if (search && search != "") {
            this.where("year", "like", `%${search}%`)
            this.orWhere("class_per_year", "like", `%${search}%`)
            this.orWhere("students_per_class", "like", `%${search}%`)
            this.orWhereHas("studyPrograms", builder => {
              builder.whereHas("studyName", builder2 => {
                builder2.where("name", "like", `%${search}%`)
              })
            })
          }

          if (study_program_id && study_program_id != "") {
            this.where("study_program_id", study_program_id)
          }

          if (search_by && search_query) {
            this.where(search_by, search_query)
          }

          if (between_date && start_date && end_date) {
            this.whereBetween(between_date, [start_date, end_date])
          }
        })
        .orderBy(sort_by, sort_mode)
        .paginate(page, limit)

      let parsed = ResponseParser.apiCollection(data.toJSON())

      if (!search || search == "") {
        await RedisHelper.set(redisKey, parsed)
      }
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Store
   * Store New StudyYears
   * Can only be done by Super Administrator
   */
  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const exist = await this.checkStudyYear(body)
      if (exist) {
        return response
          .status(422)
          .send(ResponseParser.apiValidationFailed(yearUniqueFailed))
      }
      const data = await StudyYear.create(body)
      await RedisHelper.delete("StudyYear_*")
      const activity = `Add new StudyYear '${data.year}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      let parsed = ResponseParser.apiCreated(data.toJSON())
      return response.status(201).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Show
   * StudyYear by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `StudyYear_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await StudyYear.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      let parsed = ResponseParser.apiItem(data.toJSON())
      await RedisHelper.set(redisKey, parsed)
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Update
   * Update StudyYear by Id
   * Can only be done by Super Administrator
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await StudyYear.find(id)
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.merge(body)
      await data.save()
      const activity = `Update StudyYear '${data.year}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("StudyYear_*")
      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete StudyYear by Id
   * Can only be done by Super Administrator
   * Default StudyYear ['Super Administrator', 'Administrator', 'Supervisor', 'Marketing', 'Student'] cannot be deleted
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await StudyYear.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      const activity = `Delete StudyYear '${data.year}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("StudyYear_*")
      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  async checkStudyYear(body) {
    const study_program_id = body.study_program_id
    const year = body.year
    const count = await StudyYear.query()
      .where("study_program_id", study_program_id)
      .where("year", year)
      .getCount()
    if (count > 0) {
      return true
    } else {
      return false
    }
  }
}

module.exports = StudyYearController
