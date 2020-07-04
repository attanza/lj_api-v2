const Env = use("Env")
const ErrorLog = use("App/Models/ErrorLog")
module.exports = async (request, e) => {
  console.log("e", e)
  const NODE_ENV = Env.get("NODE_ENV")
  if (NODE_ENV === "production") {
    await ErrorLog.create({
      url: request.url(),
      method: request.method(),
      error: e.message,
    })
    // const subject = `langsungjalan error: ${request.method()} ${request.url()}`
    // TODO: Send Mail
  }
}
