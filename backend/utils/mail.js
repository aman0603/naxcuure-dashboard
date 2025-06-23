// utils/mail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

exports.sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Naxcuure" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html
  });
};
