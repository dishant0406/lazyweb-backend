//controller
import nodeMailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken'
import { User } from "../../Model/User.js";


/* This code is creating a transport object using the nodemailer library to send emails. It is
specifying the email service provider's host, port, and authentication details (email and password)
to create the transport object. In this case, it is using the Zoho email service provider. */
const transport = nodeMailer.createTransport({
  host: "smtp.zoho.in",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});


/**
 * The function generates an email template with a login link for a user.
 */
const emailTemplate = ({ username, link }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #ffffff; box-shadow: 0px 3px 10px rgba(0,0,0,0.1);">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 20px; background-color: #ffffff;">
      <img src="https://i.ibb.co/cw3P4X6/Logo.png" alt="Lazyweb Logo" style="width: 100px; height: 100px;">
    </div>

    <!-- Greeting -->
    <h2 style="font-size: 24px; color: #333333; margin-bottom: 10px;">Hey ${username},</h2>

    <!-- Main Content -->
    <p style="font-size: 18px; line-height: 1.6; color: #666666;">
      We noticed you requested a new login link. No worries! You can use the button below to securely log in.
    </p>

    <!-- Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${link}" style="background-color: #4285f4; color: white; text-decoration: none; padding: 15px 25px; border-radius: 4px; font-size: 18px;">Log In</a>
    </div>

    <!-- Secondary Content -->
    <p style="font-size: 16px; line-height: 1.5; color: #666666;">
      If you didn't request this link, please ignore this email or contact support if you have any questions.
    </p>

    <!-- Signature -->
    <p style="font-size: 16px; line-height: 1.5; color: #666666; margin-top: 30px;">
      Best,<br>
      The Lazyweb Team
    </p>
  </div>
</body>
</html>
`;






/**
 * The function generates a JSON Web Token with an email, expiration date, and isAdmin flag.
 * @param email - The email parameter is a string that represents the email address of the user for
 * whom the token is being generated.
 * @param [isAdmin=false] - isAdmin is a boolean parameter that is used to indicate whether the user is
 * an admin or not. If the value of isAdmin is true, it means that the user is an admin, and if it is
 * false, it means that the user is not an admin. This parameter is optional and its default value
 * @returns The function `makeToken` is returning a JSON Web Token (JWT) that contains the `email`,
 * `expirationDate`, and `isAdmin` properties that are passed as payload to the `jwt.sign` method. The
 * `expirationDate` is set to 5 days from the current date and time. The JWT is signed using the
 * `process.env.JWT_SECRET_KEY` as the secret key.
 */
export const makeToken = (email, isAdmin = false, id) => {
  const expirationDate = new Date();
  expirationDate.setHours(new Date().getHours() + (24 * 5));
  return jwt.sign({ email, expirationDate, isAdmin, id }, process.env.JWT_SECRET_KEY);
};

/**
 * This function logs in a user by sending a magic link to their email address and creating a token for
 * them.
 * @param req - req stands for request and it is an object that contains information about the incoming
 * HTTP request such as the request parameters, headers, body, and more. It is used to retrieve data
 * sent by the client to the server.
 * @param res - `res` is the response object that is used to send the response back to the client
 * making the request. It contains methods like `status()` to set the HTTP status code, `send()` to
 * send the response body, and many others. In this code snippet, `res` is used to
 * @returns a Promise that resolves to the result of the `transport.sendMail()` method. The result of
 * this method is not explicitly returned, but it is being used to determine the response that is sent
 * back to the client. If the `sendMail()` method succeeds, the response will have a status of 200 and
 * a message indicating that the magic link has been sent. If the method
 */
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
    const newUser = new User({
      email: email,
      isAdmin: false,
    })
    await newUser.save()
    token = makeToken(email, false, user._id);
  } else {
    token = makeToken(email, user.isAdmin, user._id);
  }

  const mailOptions = {
    from: '"Lazyweb" <admin@lazyweb.rocks>',
    html: emailTemplate({
      username: email,
      link: `${process.env.FRONTEND_URL}/?token=${token}`,
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
      res.json({
        message: "Magic link has been sent.",
        success: true,
      })
    }
  });
}