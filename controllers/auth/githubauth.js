import axios from 'axios';
import dotenv from 'dotenv';
import { User } from '../../Model/User.js';
import { makeToken } from './login.js';
dotenv.config();

/**
 * This is a JavaScript function that handles a GitHub authentication request and returns a JWT token
 * and user email to the frontend.
 * @param {Object} req - The request object containing the authorization code and state.
 * @param {Object} res - The response object.
 * @returns {Object} - The script that sends the user email and JWT token to the frontend.
 * @throws {Error} - An error if the request fails or validation fails.
 */
const github = async (req, res) => {
  try {
    // Extract authorize code and state
    const { code, state } = req.query;
    const id = req?.params?.id;

    // Validate required parameters
    if (!code || !state ) {
      throw new Error('Missing required parameters');
    }

    // Validate redirect_uri against allowed origins
    let redirect_uri = process.env.FRONTEND_URL

    if (id) {
      //base64 decode the id
      const buff = Buffer.from(id, 'base64');
      const decodedId = buff.toString('utf-8');
      redirect_uri = decodedId;
    }

    console.log("Redirect URI: ", redirect_uri);

    // Configure request params for access token
    const options = {
      method: 'POST',
      url: process.env.GH_URL,
      data: {
        client_id: process.env.GH_CLIENT_ID,
        client_secret: process.env.GH_CLIENT_SECRET,
        code,
        state,
        scope: 'user:email'
      },
      headers: {
        accept: 'application/json'
      }
    };

    // Request access token
    const response = await axios(options);

    if (response.data.error) {
      console.log(response.data);
      throw new Error(response.data.error_description || response.data.error);
    }

    // Configure request for email
    const options_email = {
      method: 'GET',
      url: process.env.GH_API_URL,
      headers: {
        accept: 'application/json',
        'User-Agent': 'custom',
        Authorization: `Bearer ${response.data.access_token}`
      }
    };

    // Get user's email
    const emailResponse = await axios(options_email);
    const email = emailResponse.data.find(e => e.primary)?.email;

    if (!email) {
      throw new Error('No primary email found');
    }

    // Find or create user
    const user = await User.findOne({ email: email });
    let userId;

    if (!user) {
      const newUser = new User({
        email: email,
        isAdmin: false
      });
      const savedUser = await newUser.save();
      userId = savedUser._id;
    } else {
      userId = user._id;
    }

    // Generate token
    const token = makeToken(email, user?.isAdmin, userId);

    // Return response script with state parameter for validation
    return res.send(`
      <script>
        window.opener.postMessage({
          user: ${JSON.stringify(email)},
          jwt: '${token}',
          state: '${state}'
        }, '${redirect_uri}');
        window.close();
      </script>
    `);
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    // Return error script
    return res.send(`
      <script>
        window.opener.postMessage({
          error: '${error.message}'
        }, '${process.env.FRONTEND_URL}');
        window.close();
      </script>
    `);
  }
};

/**
 * This function redirects the user to the GitHub OAuth authorization URL with the specified parameters.
 * @param {Object} req - The request object containing the redirect_uri.
 * @param {Object} res - The response object.
 * @returns {Object} - The GitHub OAuth authorization URL redirect.
 * @throws {Error} - An error if the request fails.
 */
const githubOAuth = (req, res) => {
  let { redirect_uri, state } = req.query;

  if(!redirect_uri) {
    redirect_uri = "https://api.lazyweb.rocks/oauth/redirect/" +  encodeURIComponent(btoa(process.env.FRONTEND_URL));
  }

  if(!state) {
    state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  }

  if (!redirect_uri || !state) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  console.log("Redirect URI: ", redirect_uri);

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [process.env.FRONTEND_URL];
  const redirectUrl = new URL(redirect_uri);
  
  if (!allowedOrigins.includes(redirectUrl.origin)) {
    return res.status(400).json({ error: 'Invalid redirect_uri' });
  }

  const authUrl = new URL(process.env.GH_AUTH_URL);
  authUrl.searchParams.append('client_id', process.env.GH_CLIENT_ID);
  authUrl.searchParams.append('scope', 'user:email');
  authUrl.searchParams.append('redirect_uri', redirect_uri);
  authUrl.searchParams.append('state', state);

  console.log("Auth URL: ", authUrl.toString());

  return res.redirect(authUrl.toString());
};

export {
  github,
  githubOAuth
};
