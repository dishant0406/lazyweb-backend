import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import captureWebsite from 'capture-website';
import dotenv from 'dotenv';
import { extractMetadata } from 'link-meta-extractor';
import path, { dirname } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

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
  // Remove any www. that appears at the beginning of the string
  url = url.replace('www.', '');
  // Remove any http:// that appears at the beginning of the string
  url = url.replace('http://', '');
  // Remove any / that appears at the end of the string
  url = url.replace(/\/+$/, '');
  return url;
};

const formatUrl = (url) => {
  // Ensure URL starts with http:// or https://
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  // // Add www. if it is missing
  // if (!/^https?:\/\/www\./i.test(url)) {
  //   url = url.replace(/^https?:\/\//i, '$&www.');
  // }

  // Remove any trailing '/'
  url = url.replace(/\/+$/, '');

  return url;
};

export const getImageUrl = async (url, latest = false) => {
  const formattedUrl = unFormatUrl(url);
  let s3Key = `${formattedUrl}.webp`;

  try {
    const headObject = await S3.send(new HeadObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: s3Key,
    }));

    if (headObject && !latest) {
      return `${process.env.PUBLIC_ENDPOINT}/${s3Key}`;
    }

    if (latest) {
      await S3.send(new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: s3Key,
      }));
    }

    const screenShotBuffer = await captureWebsite.buffer(formatUrl(url), {
      launchOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ]
      },
      type: 'png',
      width: 1920,
      height: 1080,

    });

    // Resize the PNG image
    const resizedPngBuffer = await sharp(screenShotBuffer)
      .resize(460, 288, { fit: 'cover' })
      .png()
      .toBuffer();

    // Convert the resized PNG to WebP with compression
    const webpBuffer = await sharp(resizedPngBuffer)
      .webp({ quality: 80, effort: 6 })
      .toBuffer();

    // Upload to S3
    await S3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: s3Key,
      Body: webpBuffer,
      ContentType: 'image/webp',
    }));

    return `${process.env.PUBLIC_ENDPOINT}/${s3Key}`;

  } catch (err) {
    if (err.name === 'NotFound') {
      const screenShotBuffer = await captureWebsite.buffer(formatUrl(url), {
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        },
        type: 'png',
        width: 1920,
        height: 1080,
        
      });

      // Resize the PNG image
      const resizedPngBuffer = await sharp(screenShotBuffer)
        .resize(460, 288, { fit: 'cover' })
        .png()
        .toBuffer();

      // Convert the resized PNG to WebP with compression
      const webpBuffer = await sharp(resizedPngBuffer)
        .webp({ quality: 80, effort: 6 })
        .toBuffer();

      // Upload to S3
      await S3.send(new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: s3Key,
        Body: webpBuffer,
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
