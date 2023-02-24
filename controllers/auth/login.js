//controller
import nodeMailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken'
import { User } from "../../Model/User.js";

// Set up email
const transport = nodeMailer.createTransport({
  host: "smtp.zoho.in",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Make email template for magic link
const emailTemplate = ({ username, link }) => `
  <h2>Hey ${username}</h2>
  <p>Here's the login link you just requested:</p>
  <p>${link}</p>
`

// Generate token
export const makeToken = (email, isAdmin = false) => {
  const expirationDate = new Date();
  expirationDate.setHours(new Date().getHours() + (24 * 5));
  return jwt.sign({ email, expirationDate, isAdmin }, process.env.JWT_SECRET_KEY);
};

export const login = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(404);
    res.send({
      message: "You didn't enter a valid email address.",
    });
  }
  let token;
  //findOne using User model by email if there is nothing then add the User
  const user = await User.findOne({ email })
  if (!user) {
    token = makeToken(email);
  } else {
    token = makeToken(email, user.isAdmin);
  }

  const mailOptions = {
    from: '"Lazyweb" <admin@lazyweb.rocks>',
    html: emailTemplate({
      email,
      link: `${process.env.BACKEND_URL}/api/auth/account?token=${token}`,
    }),
    subject: "Your Magic Link",
    to: email,
  };
  return transport.sendMail(mailOptions, (error) => {
    if (error) {
      res.status(404);
      console.log(error)
      res.send("Can't send email.");
    } else {
      res.status(200);
      res.send(`Magic link sent. : ${process.env.BACKEND_URL}/api/auth/account?token=${token}`);
    }
  });
}