import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken'
import { User } from '../../Model/User.js'

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
  res.redirect(`https://app.lazyweb.rocks/auth?token=${token}`)
}

export const isAuthenticated = (req, res) => {
  isAuthenticatedFunc(req, res)
}