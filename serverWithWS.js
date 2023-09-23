import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from "cors";
import dotenv from 'dotenv';
import { githubRoute, loginRoute, websitesRoute } from './routes/index.js';
import { connectDB } from './utils/db.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import captureWebsite from 'capture-website';
import apicache from 'apicache-plus';
import { extractMetadata } from 'link-meta-extractor';

dotenv.config();
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

connectDB();

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static('screenshots'));
const screenshotPath = path.join(__dirname, 'screenshots');

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

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
  });

  ws.send('Hello from WebSocket server!');
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`🚀 Server (HTTP & WS) ready at http://localhost:${port}`);
});