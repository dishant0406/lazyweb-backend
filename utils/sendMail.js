import * as aws from '@aws-sdk/client-ses';
import dotenv from 'dotenv';
import { SendEmailCommand } from '@aws-sdk/client-ses';

dotenv.config();

const ses_access_key = process.env.SES_ACCESS_KEY;
const ses_secret_key = process.env.SES_SCERET_KEY;

console.log('SES Access Key:', process.env.SES_ACCESS_KEY);
console.log('SES Secret Key:', process.env.SES_SECRET_KEY);


const ses = new aws.SESClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: ses_access_key,
    secretAccessKey: ses_secret_key,
  },
});

export const sendMail = async (to, subject, html) => {
  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Data: html,
          Charset: 'UTF-8',
        },
      },
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
    },
    Source: 'admin@lazyweb.rocks',
  };

  const sendEmailCommand = new SendEmailCommand(params);

  try {
    const data = await ses.send(sendEmailCommand);
    console.log('Email sent:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};
