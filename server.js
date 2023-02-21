import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';
import login from './routes/auth/login.js';
import { connectDB } from './utils/db.js';
dotenv.config();
const app = express();


connectDB();

// Set up middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.use('/api/auth', login);



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