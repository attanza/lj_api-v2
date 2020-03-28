"use strict"
const randomstring = require("randomstring")
const MailJet = require("./MailJet")
const getContent = order => {
  return `
    <p>Halo ${order.name},</p>
<p>Berikut nomor aktifasi produk yang kamu pilih:</p>
<table>
  <tr>
    <td>No Order</td>
    <td>${order.order_no}</td>
  </tr>
  <tr>
    <td>Produk</td>
    <td>${order.product.name}</td>
  </tr>
  <tr>
    <td>Kode Aktifasi</td>
    <td>${order.activation_code}</td>
  </tr>
</table>

<p>Terimakasih.</p>
    `
}

const generateActivator = async order => {
  const code = randomstring.generate({
    length: 12,
    charset: "alphanumeric",
    capitalization: "lowercase",
  })
  order.activation_code = code
  order.paid_at = new Date()
  await order.save()
  await order.load("product")

  const jsonOrder = order.toJSON()
  const { name, email } = jsonOrder
  const subject = "Kode Aktifasi Produk Yapindo"
  const content = getContent(jsonOrder)
  MailJet({ name, email, subject, content })
}

module.exports = generateActivator
