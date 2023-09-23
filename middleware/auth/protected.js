import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
dotenv.config();
import { User } from '../../Model/User.js';

/**
 * This function checks if a user is authenticated by verifying their JWT token and adding the decoded
 * user to the request object for use in subsequent middleware/routes.
 * @header - The authorization header containing the JWT token.
 * @param - The request object.
 * @returns - The response object.
 * @throws - An error if the request fails.
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
