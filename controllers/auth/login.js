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
  host: "smtp.mail.us-east-1.awsapps.com",
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
* The function generates an email template with a login token for a user.
*/
const emailTemplateExt = ({ username, token }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Access Token</title>
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
      We noticed you requested a new login token. No worries! Below is your secure token. Copy it and use it to log in.
    </p>

    <!-- Token Box -->
    <div style="text-align: center; margin: 30px 0; padding: 10px; border: 1px solid #ddd; background-color: #f5f5f5; font-size: 16px; color: #444;">
      ${token}
    </div>

    <!-- Secondary Content -->
    <p style="font-size: 16px; line-height: 1.5; color: #666666;">
      If you didn't request this token, please ignore this email or contact support if you have any questions.
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
 */
export const makeToken = (email, isAdmin = false, id) => {
  const expirationDate = new Date();
  expirationDate.setHours(new Date().getHours() + (24 * 5));
  return jwt.sign({ email, expirationDate, isAdmin, id }, process.env.JWT_SECRET_KEY);
};

/**
 * This function logs in a user by sending a magic link to their email address and creating a token for
 * them.
 * @param - The email address of the user.
 * @returns - The script that sends the magic link to the user's email address.
 * @throws - An error if the request fails.
 */
export const login = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(404).send({
      message: "You didn't enter a valid email address.",
    });
  }
  let token;
  //findOne using User model by email if there is nothing then add the User
  const user = await User.findOne({ email });
  if (!user) {
    const newUser = new User({
      email: email,
      isAdmin: false,
    });
    await newUser.save();
    token = makeToken(email, false, newUser._id);
  } else {
    token = makeToken(email, user.isAdmin, user._id);
  }

  const mailOptions = {
    from: '"Lazyweb" <dishant@lazyweb.rocks>',
    html: emailTemplate({
      username: email,
      link: `${process.env.FRONTEND_URL}/?token=${token}`,
    }),
    subject: "Your Magic Link",
    to: email,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    res.status(200).json({
      message: "Magic link has been sent.",
      info: info,
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(404).send("Can't send email.");
  }
};


/**
 * This function logs in a user by sending a magic link to their email address and creating a token for
 * them.
 * @param - The email address of the user.
 * @returns - The script that sends the magic link to the user's email address.
 * @throws - An error if the request fails.
 */
export const loginExt = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(404).send({
      message: "You didn't enter a valid email address.",
    });
  }
  let token;
  //findOne using User model by email if there is nothing then add the User
  const user = await User.findOne({ email });
  if (!user) {
    const newUser = new User({
      email: email,
      isAdmin: false,
    });
    await newUser.save();
    token = makeToken(email, false, newUser._id);
  } else {
    token = makeToken(email, user.isAdmin, user._id);
  }

  const mailOptions = {
    from: '"Lazyweb" <dishant@lazyweb.rocks>',
    html: emailTemplateExt({
      username: email,
      token: token,
    }),
    subject: "Your Magic Token",
    to: email,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    res.status(200).json({
      message: "Magic token has been sent.",
      success: true,
      info: info
    });
  } catch (error) {
    console.log(error);
    res.status(404).send("Can't send email.");
  }
};



/**
 * This function verifies the token sent by the user.
 * @param - The token sent by the user.
 * @returns - A message indicating whether the token is valid or not.
 * @throws - An error if the request fails.
 */
export const verifyToken = async (req, res) => {
  //token from Bearer token
  const token = req.headers.authorization.split(" ")[1];

  console.log(token);
  if (!token) {
    return res.status(404).send({
      message: "You didn't enter a valid token.",
      success: false,
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);
    console.log(decoded);
    console.log(user);
    if (!user) {
      return res.status(404).send({
        message: "You didn't enter a valid token.",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Token is valid.",
      success: true,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    return res.status(404).send({
      message: "You didn't enter a valid token.",
      success: false,
    });
  }
}
