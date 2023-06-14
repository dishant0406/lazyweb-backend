import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
dotenv.config();
import { User } from '../../Model/User.js';

/**
 * This function checks if a user is authenticated by verifying their JWT token and adding the decoded
 * user to the request object for use in subsequent middleware/routes.
 * @param req - req stands for request and it is an object that contains information about the HTTP
 * request that is made to the server. It includes information such as the request method, headers,
 * URL, and any data that is sent in the request body.
 * @param res - `res` stands for response. It is an object that represents the HTTP response that an
 * Express app sends when it receives an HTTP request. It contains methods for setting the status code,
 * headers, and body of the response. In the `isAuthenticated` middleware function, `res` is used to
 * @param next - `next` is a function that is called to pass control to the next middleware function or
 * route handler in the chain. It is typically used to move on to the next function in the middleware
 * stack after the current function has completed its work. If `next()` is not called, the request will
 * be
 * @returns The function `isAuthenticated` is returning either a response with an error message and a
 * status code of 403 (Forbidden) or calling the `next()` function to proceed to the next middleware or
 * route. The specific response that is returned depends on the outcome of the checks performed on the
 * `authHeader` and `token`, as well as the verification of the JWT token and the existence of a user
 */
const isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: "Can't verify user." });
  }
  const token = authHeader.slice(7);
  if (!token) {
    return res.status(403).json({ error: "Can't verify user." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded.hasOwnProperty("email") || !decoded.hasOwnProperty("expirationDate")) {
      return res.status(403).json({ error: "Invalid auth credentials." });
    }
    const { expirationDate } = decoded;
    if (expirationDate < new Date()) {
      return res.status(403).json({ error: "Token has expired." });
    }
    // Add decoded user to request object for use in subsequent middleware/routes
    req.user = decoded;

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(403).json({ error: "No User Found" })
    }


    next();
  }
  catch (err) {
    return res.status(403).json({ error: "Invalid auth credentials." });
  }
};

export {
  isAuthenticated
}
