import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ZOHO_MAIL_API_URL = 'https://mail.zoho.in/api/accounts';
const ZOHO_ACCOUNT_ID = "3116782000000002002";
const ZOHO_CLIENT_ID = "1000.SKVBOSD7ZAS4515GKSX5XIIU387ZAY";
const ZOHO_CLIENT_SECRET = "33194e98c69a9e39e5d3d91d026e17af1dbaab1b54";
const ZOHO_REFRESH_TOKEN = "1000.6af437ac0ce2a324027c7626640c968a.51355dece649708aeb420205c45aa2ca"

async function getAccessToken() {
  const response = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
    params: {
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token'
    }
  });
  return response.data.access_token;
}

export const sendMail = async (to, subject, html) => {
  try {
    const accessToken =  await getAccessToken();

    const response = await axios.post(
      `${ZOHO_MAIL_API_URL}/${ZOHO_ACCOUNT_ID}/messages`,
      {
        fromAddress: 'admin@lazyweb.rocks',
        toAddress: to,
        subject: subject,
        content: html,
        askReceipt: 'yes'
      },
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(response?.data?.status || {});
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};
