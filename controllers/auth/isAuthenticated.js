import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken'
import { User } from '../../Model/User.js'

/**
 * This function checks if a user is authenticated by verifying their token and redirecting them to a
 * specific URL, and adds the user to the database if they don't exist.
 * @param req - The `req` parameter is an object that represents the HTTP request made by the client to
 * the server. It contains information such as the request method, headers, query parameters, and body.
 * @param res - The `res` parameter is an object representing the HTTP response that will be sent back
 * to the client. It contains methods for setting the response status, headers, and body.
 * @returns The function is not returning anything explicitly, but it is sending a response to the
 * client using the `res.send()` and `res.redirect()` methods. The response status code is also being
 * set using the `res.status()` method.
 */
const isAuthenticatedFunc = (req, res) => {
  const { token } = req.query
  if (!token) {
    res.status(403)
    res.send("Can't verify user.")
    return
  }
  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
  }
  catch {
    res.status(403)
    res.send("Invalid auth credentials.")
    return
  }
  if (!decoded.hasOwnProperty("email") || !decoded.hasOwnProperty("expirationDate")) {
    res.status(403)
    res.send("Invalid auth credentials.")
    return
  }
  const { expirationDate } = decoded
  if (expirationDate < new Date()) {
    res.status(403)
    res.send("Token has expired.")
    return
  }

  //findOne using User model by email if there is nothing then add the User
  User.findOne({ email: decoded.email }, (err, user) => {
    if (err) {
      res.status(500)
      res.send("Internal server error.")
      return
    }
    if (!user) {
      const newUser = new User({
        email: decoded.email,
        isAdmin: decoded.isAdmin
      })
      newUser.save((err, user) => {
        if (err) {
          res.status(500)
          res.send("Internal server error.")
          return
        }
      }
      )
    }
  })

  console.log(decoded.email)

  res.status(200)
  res.redirect(`https://app.lazyweb.rocks/token=${token}`)
}

export const isAuthenticated = (req, res) => {
  isAuthenticatedFunc(req, res)
}

export const getUserDetails = async (req, res) => {
  const { email } = req.user
  const user = await User.findOne({ email: email })

  if (!user) {
    res.status(404)
    res.send("User not found.")
    return
  }

  res.status(200)
  res.send(user)


}