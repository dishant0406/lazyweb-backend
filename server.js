import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';
import { githubRoute, loginRoute, websitesRoute } from './routes/index.js'
import { connectDB } from './utils/db.js';
import { isAuthenticated } from './middleware/auth/protected.js'
dotenv.config();
const app = express();


connectDB();

// Set up middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


//Auth Routes
app.use('/api/auth', loginRoute);
app.use('/oauth', githubRoute);

// Websites Routes
app.use('/api/websites', websitesRoute);

app.get('/hello', isAuthenticated, (req, res) => {
  console.log(req.user)
  res.send('Hello World')
})



app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000`)
);
