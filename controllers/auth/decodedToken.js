import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
dotenv.config();


/**
 * This function decodes a JWT token and checks if it is valid, returning an error message if it is
 * not.
 * @param req - req stands for "request" and it is an object that represents the HTTP request made by
 * the client to the server. It contains information about the request such as the URL, headers,
 * parameters, and body.
 * @param res - `res` is the response object that is used to send the response back to the client
 * making the request. It is an instance of the `http.ServerResponse` class in Node.js. The `res`
 * object has methods like `status()` and `send()` that are used to set the HTTP
 * @returns This function returns the decoded token if it is valid and has not expired. If the token is
 * missing, invalid, or expired, it returns an error message with an appropriate status code.
 */
export const decodedToken = (req, res) => {
  const { token } = req.body
  if (!token) {
    res.status(403)
    res.send({ error: "Can't verify user." })
    return
  }
  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
  }
  catch {
    res.status(403)
    res.send({ error: "Invalid auth credentials." })
    return
  }
  if (!decoded.hasOwnProperty("email") || !decoded.hasOwnProperty("expirationDate")) {
    res.status(403)
    res.send({ error: "Invalid auth credentials." })
    return
  }
  const { expirationDate } = decoded
  if (expirationDate < new Date()) {
    res.status(403)
    res.send({ error: "Token has expired." })
    return
  }
  res.status(200)
  res.send(decoded)
}
