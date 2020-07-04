"use strict"

const University = use("App/Models/University")
const { RedisHelper, ResponseParser, ErrorLog, GetRequestQuery } = use(
  "App/Helpers"
)
const { ActivityTraits } = use("App/Traits")
const fillable = [
  "name",
  "address",
  "email",
  "phone",
  "contact_person",
  "description",
  "province",
  "city",
  "lat",
  "lng",
]

class UniversityController {
  /**
   * Index
   * Get List of Universities
   */
  async index(ctx) {
    const { request, response } = ctx

    try {
      const q = await GetRequestQuery(ctx)
      const redisKey = `University_${q.redisKey}`
      let cached = await RedisHelper.get(redisKey)

      if (cached && !q.search) {
        console.log(redisKey)
        return cached
      }

      const data = await University.query()
        .where(function() {
          if (q.search && q.search != "") {
            this.where("name", "like", `%${q.search}%`)
            this.orWhere("email", "like", `%${q.search}%`)
            this.orWhere("phone", "like", `%${q.search}%`)
            this.orWhere("contact_person", "like", `%${q.search}%`)
            this.orWhere("province", "like", `%${q.search}%`)
            this.orWhere("city", "like", `%${q.search}%`)
          }

          if (q.search_by && q.search_query) {
            this.where(q.search_by, q.search_query)
          }

          if (q.between_date && q.start_date && q.end_date) {
            this.whereBetween(q.between_date, [q.start_date, q.end_date])
          }
        })
        .orderBy(q.sort_by, q.sort_mode)
        .paginate(q.page, q.limit)

      let parsed = ResponseParser.apiCollection(data.toJSON())

      if (!q.search || q.search == "") {
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
   * Store New Universitys
   * Can only be done by Super Administrator
   */

  async store({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const data = await University.create(body)
      await RedisHelper.delete("University_*")
      await RedisHelper.delete("Dashboard_Data")
      await RedisHelper.delete("StudyProgram_*")
      const activity = `Add new University '${data.name}'`
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
   * University by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id
      let redisKey = `University_${id}`
      let cached = await RedisHelper.get(redisKey)
      if (cached) {
        return response.status(200).send(cached)
      }
      const data = await University.find(id)
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
   * Update University by Id
   * Can only be done by Super Administrator
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable)
      const id = request.params.id
      const data = await University.find(id)
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.merge(body)
      await data.save()
      const activity = `Update University '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("University_*")
      await RedisHelper.delete("Dashboard_Data")
      await RedisHelper.delete("StudyProgram_*")

      let parsed = ResponseParser.apiUpdated(data.toJSON())
      return response.status(200).send(parsed)
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }

  /**
   * Delete
   * Delete University by Id
   * Can only be done by Super Administrator
   * Default University ['Super Administrator', 'Administrator', 'Supervisor', 'Marketing', 'Student'] cannot be deleted
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id
      const data = await University.find(id)
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound())
      }
      await data.load("studies")
      const jsonData = data.toJSON()
      if (jsonData.studies.length > 0) {
        return response
          .status(400)
          .send(
            ResponseParser.errorResponse(
              "Perguruan Tinggi tidak bisa dihapus, karena memiliki satu atau beberapa Studi Program"
            )
          )
      }

      const activity = `Delete University '${data.name}'`
      await ActivityTraits.saveActivity(request, auth, activity)
      await RedisHelper.delete("University_*")
      await RedisHelper.delete("Dashboard_Data")
      await RedisHelper.delete("StudyProgram_*")

      await data.delete()
      return response.status(200).send(ResponseParser.apiDeleted())
    } catch (e) {
      ErrorLog(request, e)
      return response.status(500).send(ResponseParser.unknownError())
    }
  }
}

module.exports = UniversityController
