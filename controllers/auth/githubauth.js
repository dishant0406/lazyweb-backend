import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios'
import { makeToken } from './login.js'


const github = async (req, res) => {
  try {
    // extract authorize code 
    const code = req.query.code;

    // configure request params
    const options = {
      method: 'POST',
      url: process.env.GITHUB_URL,
      data: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        scope: 'user:email'
      },
      headers: {
        accept: 'application/json'
      }
    };

    // make a request for auth_token using above options
    const response = await axios(options);


    const options_email = {
      method: 'GET',
      url: process.env.GITHUB_API_URL,
      headers: {
        accept: 'application/json',
        'User-Agent': 'custom',
        Authorization: `Bearer ${response.data.access_token}`
      }
    };

    const emailResponse = await axios(options_email);
    const email = emailResponse.data.find(e => e.primary)?.email;

    // make a token
    const token = makeToken(email);
    res.redirect(`${process.env.BACKEND_URL}/api/auth/account?token=${token}`)
  } catch (error) {
    console.error(error);
    return res.json(error);
  }
};


const githubOAuth = (req, res) => {
  return res.redirect(`${process.env.GITHUB_AUTH_URL}${process.env.GITHUB_CLIENT_ID}&scope=user:email`);
}

export {
  github,
  githubOAuth
}