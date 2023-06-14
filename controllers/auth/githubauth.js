import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios'
import { makeToken } from './login.js'


/**
 * This is a JavaScript function that handles a GitHub authentication request and returns a JWT token
 * and user email to the frontend.
 * @param req - `req` is an object that represents the HTTP request made to the server. It contains
 * information such as the request method, URL, headers, and query parameters. In this code snippet,
 * `req` is used to extract the authorization code from the query parameters of the request.
 * @param res - `res` is the response object that will be sent back to the client making the request.
 * It contains methods and properties that allow the server to send a response back to the client, such
 * as `send`, `json`, and `status`. In this code, `res.send` is used to
 * @returns a response to the client. If the function executes successfully, it will return a script
 * that sends a message to the parent window with the user's email and a JSON Web Token (JWT) that was
 * created using the email. If there is an error, it will return a JSON object with the error
 * information.
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

    // make a token
    const token = makeToken(email);
    return res.send(`
    <script>
      window.opener.postMessage({
        user: ${JSON.stringify(email)},
        jwt: '${token}'
      }, '${process.env.BACKEND_URL}');
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
 * @param req - req is an object that represents the HTTP request made by the client to the server. It
 * contains information such as the request method, headers, URL, and any data sent in the request
 * body. In this specific function, the req parameter is not used.
 * @param res - `res` is the response object that is passed as a parameter to the function. It is used
 * to send a redirect response to the client's browser. In this case, the function is redirecting the
 * user to the GitHub OAuth authorization URL with the appropriate client ID and scope.
 * @returns a redirect response to the GitHub OAuth authorization URL with the client ID and email
 * scope.
 */
const githubOAuth = (req, res) => {
  return res.redirect(`${process.env.GITHUB_AUTH_URL}${process.env.GITHUB_CLIENT_ID}&scope=user:email`);
}

export {
  github,
  githubOAuth
}