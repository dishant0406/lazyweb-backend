
import nodemailer from "nodemailer";
import * as aws from "@aws-sdk/client-ses";
import * as dotenv from 'dotenv'

dotenv.config()

const ses_access_key = process.env.SES_ACCESS_KEY
const ses_sec_key = process.env.SES_SCERET_KEY

const ses = new aws.SESClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: ses_access_key,
    secretAccessKey: ses_sec_key,
  },
});

const transporter = nodemailer.createTransport({
  SES: { ses, aws },
});

export const sendMail = async (to, subject, html) => {
  const mailOptions = {
    from: "admin@lazyweb.rocks",
    html,
    subject,
    to,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(info);
  } catch (error) {
    console.log(error);
  }


}
