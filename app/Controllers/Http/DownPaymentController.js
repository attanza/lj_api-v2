"use strict";

const DownPayment = use("App/Models/DownPayment");
const { RedisHelper, ResponseParser, TwilioWAApi, ErrorLog } = use(
  "App/Helpers"
);
const { ActivityTraits } = use("App/Traits");
const randomstring = require("randomstring");
const Env = use("Env");
const fillable = [
  "marketing_target_id",
  "name",
  "phone",
  "dp",
  "kelas",
  "produk",
  "harga"
];

class DownPaymentController {
  /**
   * Index
   * Get List of DownPayment
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
        marketing_target_id
      } = request.get();

      if (!page) page = 1;
      if (!limit) limit = 200;
      if (!sort_by) sort_by = "id";
      if (!sort_mode) sort_mode = "desc";

      const redisKey = `DownPayment_${page}${limit}${sort_by}${sort_mode}${search_by}${search_query}${between_date}${start_date}${end_date}${marketing_target_id}`;

      let cached = await RedisHelper.get(redisKey);

      if (cached && !search) {
        return cached;
      }

      const data = await DownPayment.query()
        .with("target.study.university")
        .with("target.study.studyName")
        .with("verifier", builder => {
          builder.select("id", "name");
        })
        .where(function() {
          if (search && search != "") {
            // console.log("Search :" + search)
            // this.where("dp", "like", `%${search}%`)
            this.where("name", "like", `%${search}%`);
            this.orWhere("phone", "like", `%${search}%`);
            // this.orWhere("kelas", "like", `%${search}%`)
            this.orWhere("produk", "like", `%${search}%`);
            // this.orWhere("harga", "like", `%${search}%`)
            this.orWhereHas("target", builder => {
              builder.where("code", "like", `%${search}%`);
              // builder.orWhereHas("study", builder2 => {
              //   builder2.whereHas("university", builder3 => {
              //     builder3.where("name", "like", `%${search}%`)
              //   })
              // builder2.orWhereHas("studyName", builder3 => {
              //   builder3.where("name", "like", `%${search}%`)
              // })
              // })
            });
          }

          if (marketing_target_id && marketing_target_id != "") {
            this.where("marketing_target_id", marketing_target_id);
          }

          if (search_by && search_query) {
            this.where(search_by, search_query);
          }

          if (between_date && start_date && end_date) {
            this.whereBetween(between_date, [start_date, end_date]);
          }
        })
        .orderBy(sort_by, sort_mode)
        .paginate(page, limit);

      let parsed = ResponseParser.apiCollection(data.toJSON());

      if (!search || search == "") {
        await RedisHelper.set(redisKey, parsed);
      }
      return response.status(200).send(parsed);
    } catch (e) {
      ErrorLog(request, e);
      return response.status(500).send(ResponseParser.unknownError());
    }
  }

  /**
   * Store
   * Store New DownPayment
   */
  async store({ request, response, auth }) {
    try {
      const { data } = request.post();

      if (data) {
        let dataOutput = [];
        for (let i = 0; i < data.length; i++) {
          dataOutput.push(await this.storeToDb(data[i], request, auth));
        }
        return response.status(201).send(ResponseParser.apiCreated(dataOutput));
      } else {
        let body = request.only(fillable);
        let result = await this.storeToDb(body, request, auth);

        return response.status(201).send(ResponseParser.apiCreated(result));
      }
    } catch (e) {
      ErrorLog(request, e);
      return response.status(500).send(ResponseParser.unknownError());
    }
  }

  /**
   *
   * Save it into db
   */

  async storeToDb(body, request, auth) {
    try {
      body.transaction_no = await this.generateTransactionNo(body.name);
      const data = await DownPayment.create(body);
      await data.loadMany([
        "target.study.university",
        "target.study.studyName"
      ]);
      // Send SMS
      const smsMessage = `Telah Kami terima DP ${formatNumber(
        data.dp
      )} dari Sdr/i ${
        data.name.trim().split(" ")[0]
      } untuk 1 kuota subsidi produk Kami [${
        data.transaction_no
      }]. SMS ini wajib ditunjukkan saat pengambilan produk.`;
      const NODE_ENV = Env.get("NODE_ENV");
      // if (NODE_ENV === "production") {
      // TwilioWAApi(data.phone, smsMessage);
      // }
      await RedisHelper.delete("DownPayment_*");
      const activity = `Add new DownPayment '${data.transaction_no}'`;
      await ActivityTraits.saveActivity(request, auth, activity);
      let parsed = data.toJSON();
      return parsed;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Show
   * DownPayment by id
   */
  async show({ request, response }) {
    try {
      const id = request.params.id;
      let redisKey = `DownPayment_${id}`;
      let cached = await RedisHelper.get(redisKey);
      if (cached) {
        return response.status(200).send(cached);
      }
      const data = await DownPayment.find(id);
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound());
      }
      await data.load("target");

      let parsed = ResponseParser.apiItem(data.toJSON());
      await RedisHelper.set(redisKey, parsed);
      return response.status(200).send(parsed);
    } catch (e) {
      ErrorLog(request, e);
      return response.status(500).send(ResponseParser.unknownError());
    }
  }

  /**
   * Update
   * Update DownPayment by Id
   */
  async update({ request, response, auth }) {
    try {
      let body = request.only(fillable);
      const id = request.params.id;

      const data = await DownPayment.find(id);
      if (!data || data.length === 0) {
        return response.status(400).send(ResponseParser.apiNotFound());
      }
      /*
      As per client desicion no need to verify / send sms after verified
      const { is_verified } = request.post()
      if (is_verified && !data.verified_at) {
        const user = await auth.getUser()
        body.verified_by = user.id
        body.verified_at = new Date()
        // Send SMS
        const smsMessage = `No kwitansi: ${
          data.transaction_no
        } pelunasan 1 paket m3 dari ${
          data.name.trim().split(" ")[0]
        } telah kami terima. Selamat Belajar (Admin Yapindo).`
        TwilioApi(data.phone, smsMessage)
      }
      */
      await data.merge(body);
      await data.save();
      const activity = `Update DownPayment '${data.transaction_no}'`;
      await ActivityTraits.saveActivity(request, auth, activity);

      await RedisHelper.delete("DownPayment_*");
      await data.load("target");
      let parsed = ResponseParser.apiUpdated(data.toJSON());
      return response.status(200).send(parsed);
    } catch (e) {
      ErrorLog(request, e);
      return response.status(500).send(ResponseParser.unknownError());
    }
  }

  /**
   * Delete
   * Delete DownPayment by Id
   */
  async destroy({ request, response, auth }) {
    try {
      const id = request.params.id;
      const data = await DownPayment.find(id);
      if (!data) {
        return response.status(400).send(ResponseParser.apiNotFound());
      }
      const activity = `Delete DownPayment '${data.transaction_no}'`;
      await ActivityTraits.saveActivity(request, auth, activity);

      await RedisHelper.delete("DownPayment*");
      await data.delete();
      return response.status(200).send(ResponseParser.apiDeleted());
    } catch (e) {
      ErrorLog(request, e);
      return response.status(500).send(ResponseParser.unknownError());
    }
  }

  async generateTransactionNo() {
    let ok = false;
    let transaction_no;
    while (!ok) {
      transaction_no = randomstring.generate({
        length: 6,
        charset: "alphanumeric",
        capitalization: "lowercase"
      });
      const dp = await DownPayment.findBy("transaction_no", transaction_no);
      if (!dp) {
        ok = true;
        return transaction_no;
      }
    }
  }
}

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

module.exports = DownPaymentController;
