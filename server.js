import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';
import { githubRoute, loginRoute, websitesRoute, snippetRoute } from './routes/index.js'
import { connectDB } from './utils/db.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import path from 'path';
import apicache from 'apicache-plus';
import { initializeSocket } from './socket/index.js';
import { logger } from './middleware/logger/logger.js';
import { getImageUrl, getMetaData } from './utils/webData.js';

dotenv.config();
const app = express();

const server = http.createServer(app);
initializeSocket(server);


connectDB();

//setup
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static('screenshots'));
const screenshotPath = path.join(__dirname, 'screenshots');

// const allowedOrigins = ['http://localhost:3000', 'https://lazyweb.rocks', 'https://app.lazyweb.rocks'];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// };

// Set up middleware
app.use(cors(
  [
    'http://localhost:3000',
    'https://lazyweb.rocks',
    'https://app.lazyweb.rocks',

  ]
));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger);

//Auth Routes
app.use('/api/auth', loginRoute);
app.use('/oauth', githubRoute);


app.use('/api/websites', websitesRoute);
app.use('/api/snippets', snippetRoute);

app.post('/metadata', async (req, res) => {
  try {
    const { url } = req.body
    const metaInformation = await getMetaData(url);
    res.send(metaInformation)
  } catch (err) {
    res.status(404).json({ err: err })
  }
})

app.post('/ss', apicache('60 minutes'), async (req, res) => {
  try {
    const url = req.body.url

    const imageUrl = await getImageUrl(url);
    res.send(imageUrl);
  } catch (err) {
    res.status(404).json({ err: err })
  }
});

let port = process.env.PORT || 3000
server.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:${port}`)
);
