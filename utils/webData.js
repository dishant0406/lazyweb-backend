import { dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs'
import path from 'path';
import captureWebsite from 'capture-website';
import apicache from 'apicache-plus';
import { extractMetadata } from 'link-meta-extractor';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

//setup
const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotPath = path.join(__dirname, '..', 'screenshots');

const S3 = new S3Client({
  region: 'auto',
  endpoint: process.env.ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const unFormatUrl = (url) => {
  url = url.toLowerCase();
  // Remove any https:// that appears at the beginning of the string
  url = url.replace('https://', '');
  url = url.replaceAll('?', '');
  // Remove any www. that appears at the beginning of the string
  url = url.replace('www.', '');
  return url;
};

export const getImageUrl = async (url) => {
  const formattedUrl = unFormatUrl(url);
  const s3Key = `${formattedUrl}.webp`;

  // Check if image exists in S3
  try {
    const headObject = await S3.send(new HeadObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: s3Key,
    }));

    if (headObject) {
      return `${process.env.PUBLIC_ENDPOINT}/${s3Key}`;
    }
  } catch (err) {
    if (err.name === 'NotFound') {
      const screenShortBuffer = await captureWebsite.buffer(url, {
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

      // Upload to S3
      await S3.send(new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: s3Key,
        Body: screenShortBuffer,
        ContentType: 'image/webp',
      }));

      return `${process.env.PUBLIC_ENDPOINT}/${s3Key}`;
    }

    throw err;
  }
};

export const getMetaData = async (url) => {
  const metaInformation = await extractMetadata(url);
  return metaInformation;
}
