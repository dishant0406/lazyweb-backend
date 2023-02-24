import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
dotenv.config();

//controller to return decoded token object from req.body
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
