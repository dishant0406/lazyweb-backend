import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios'
import { makeToken } from './login.js'
import { User } from '../../Model/User.js'


/**
 * This is a JavaScript function that handles a GitHub authentication request and returns a JWT token
 * and user email to the frontend.
 * @param - The query containing the authorization code.
 * @returns - The script that sends the user email and JWT token to the frontend.
 * @throws - An error if the request fails.
 */
const github = async (req, res) => {
  try {
    // extract authorize code 
    console.log('Hello');
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

    //findOne using User model by email if there is nothing then add the User
    const user = await User.findOne({ email: email });
    if (!user) {
      const newUser = new User({
        email: email,
        isAdmin: false
      });
      await newUser.save();
    }



    // make a token
    const token = makeToken(email, user?.isAdmin, user._id);
    return res.send(`
    <script>
      window.opener.postMessage({
        user: ${JSON.stringify(email)},
        jwt: '${token}'
      }, '${process.env.FRONTEND_URL}');
    </script>
  `);
  } catch (error) {
    console.error(error);
    return res.json(error);
  }
};


/**
 * This function redirects the user to the GitHub OAuth authorization URL with the specified client ID
 * and email scope.
 * @returns - The GitHub OAuth authorization URL.
 * @throws - An error if the request fails.
 */
const githubOAuth = (req, res) => {
  return res.redirect(`${process.env.GITHUB_AUTH_URL}${process.env.GITHUB_CLIENT_ID}&scope=user:email`);
}

export {
  github,
  githubOAuth
}