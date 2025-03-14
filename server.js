import apicache from 'apicache-plus';
import cors from "cors";
import dotenv from 'dotenv';
import express from 'express';
import proxy from 'express-http-proxy';
import http from 'http';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { isAuthenticated } from './middleware/auth/protected.js';
import { logger } from './middleware/logger/logger.js';
import { githubRoute, loginRoute, snippetRoute, websitesRoute } from './routes/index.js';
import { initializeSocket } from './socket/index.js';
import { connectDB } from './utils/db.js';
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


// Set up middleware
const corsOptions = {
  origin: ['http://localhost:3000', 'https://lazyweb.rocks', 'https://app.lazyweb.rocks'],
  allowedHeaders: '*',
  credentials: true,
};



app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger);

//Auth Routes
app.use('/api/auth', loginRoute);
app.use('/oauth', githubRoute);


app.use('/api/websites', websitesRoute);
app.use('/api/snippets', snippetRoute);

app.use("/redirects", isAuthenticated)

app.use('/redirects', proxy('https://redirects.lazyweb.rocks', {
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    if (srcReq.user) {
      proxyReqOpts.headers['X-User-Id'] = srcReq.user.id;
      proxyReqOpts.headers['X-User-Email'] = srcReq.user.email;
    }
    return proxyReqOpts;
  },
  proxyReqPathResolver: (req) => {
    return req.url.replace(/^\/redirects/, '/');
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    let data = proxyResData.toString('utf-8');
    try {
      let output = JSON.parse(data);
      // Modify the output as needed
      return JSON.stringify(output);
    } catch (err) {
      return data;
    }
  },
  userResHeaderDecorator: (headers, userReq, userRes, proxyReq, proxyRes) => {
    headers['Access-Control-Allow-Origin'] = '*';
    return headers;
  },
  proxyReqBodyDecorator: (bodyContent, srcReq) => {
    return bodyContent;
  }
  
}));
  

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

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Lazyweb API',
    success: true,
    status: 200,
    data: {
      version: '1.1.0',
      author: 'Dishant Sharma',
      github: 'https://github.com/dishant0406',
      website: 'https://dishantsharma.dev',
    },
  });
})

let port = process.env.PORT || 4000
server.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:${port}`)
);
