import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';
import login from './routes/auth/login.js';
import githubLogin from './routes/auth/githubauth.js';
import { connectDB } from './utils/db.js';
import { isAuthenticated } from './middleware/auth/protected.js'
dotenv.config();
const app = express();


connectDB();

// Set up middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.use('/api/auth', login);
app.use('/oauth', githubLogin);

app.get('/hello', isAuthenticated, (req, res) => {
  console.log(req.user)
  res.send('Hello World')
})



app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000`)
);



// import { ApolloServer } from 'apollo-server-express';
// import typeDefs from './schema';
// import resolvers from './resolvers';
// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
// });
// server.applyMiddleware({ app });