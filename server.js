import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';
import { githubRoute, loginRoute, websitesRoute } from './routes/index.js'
import { connectDB } from './utils/db.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'
import path from 'path';
import captureWebsite from 'capture-website';
import apicache from 'apicache-plus';
import { extractMetadata } from 'link-meta-extractor';
dotenv.config();
const app = express();


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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


//Auth Routes
app.use('/api/auth', loginRoute);
app.use('/oauth', githubRoute);


app.use('/api/websites', websitesRoute);

app.post('/ipinfo', async (req, res) => {
  const { ip } = req.body
  try {
    const details = await ipInfo.getIPInfo.location(ip)
    res.json(details)
  } catch (err) {
    res.status(404).json({ err: err })
  }
});

app.post('/metadata', async (req, res) => {
  try {
    const { url } = req.body
    const metaInformation = await extractMetadata(url);
    res.send(metaInformation)
  } catch (err) {
    res.status(404).json({ err: err })
  }
})

/* This code block sets up a POST endpoint at the `/ss` route. When a request is made to this endpoint,
it takes the URL provided in the request body and uses it to capture a screenshot of the website
using the `capture-website` library. The captured screenshot is saved as a `.webp` file in the
`screenshots` directory. If a screenshot for the same URL already exists, it sends the existing
screenshot URL as a response. If not, it captures a new screenshot and sends the newly created
screenshot URL as a response. The `apicache` middleware is used to cache the response for 60
minutes. If there is an error, it sends a 404 status code and an error message as a response. */
app.post('/ss', apicache('60 minutes'), async (req, res) => {
  try {
    const url = req.body.url

    const unFormatUrl = (url) => {
      url = url.toLowerCase()
      // Remove any https:// that appears at the beginning of the string
      url = url.replace('https://', '');
      url = url.replaceAll('?', '')
      // Remove any www. that appears at the beginning of the string
      url = url.replace('www.', '');
      return url;
    }

    if (fs.existsSync(`${path.join(screenshotPath, unFormatUrl(url))}.webp`)) {
      res.send(`https://api.lazyweb.rocks/${unFormatUrl(url)}.webp`)
    } else {
      await captureWebsite.file(url, `${path.join(screenshotPath, unFormatUrl(url))}.webp`, {
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        },
        type: 'webp',
        width: 460,
        height: 288,
        quality: 0.3,
      });
      res.send(`https://api.lazyweb.rocks/${unFormatUrl(url)}.webp`)
    }
  } catch (err) {
    res.status(404).json({ err: err })
  }
});

let port = process.env.PORT || 3000
app.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:${port}`)
);
