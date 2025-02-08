import axios from 'axios';
import { Resource } from '../../Model/Resource.js';
import { connectDB } from '../db.js';
import { getImageUrl } from '../webData.js';

async function processResource(item) {
  try {
    const existingResource = await Resource.findOne({ url: item.url });
    if (existingResource) {
      return `Skipped: Resource already exists for ${item.name}`;
    }

    const imageUrl = await getImageUrl(item.url);
    const tags = [...new Set([...(item.categories || []), ...(item.keywords || [])])];

    const resource = new Resource({
      url: item.url,
      image_url: imageUrl,
      title: item.name,
      desc: item.description,
      tags: tags,
      category: item.categories && item.categories.length > 0 ? item.categories[0] : '',
      created_by: '63f67a6bf7f7dd1f18a7eb60', // Replace with an actual User ObjectId
      isPublicAvailable: true,
      isAvailableForApproval: true
    });

    await resource.save();
    return `Success: Added ${item.name} (Tags: ${tags.join(', ')})`;
  } catch (error) {
    return `Error processing ${item.name}: ${error.message}`;
  }
}

async function processBatch(batch) {
  return await Promise.all(batch.map(item => processResource(item)));
}

async function main(startIndex = 0) {
  try {
    await connectDB();
    
    console.log('Fetching resources from GitHub...');
    const response = await axios.get('https://raw.githubusercontent.com/marcelscruz/dev-resources/main/db/resources.json');
    const { data } = response.data;

    console.log(`Found ${data.length} resources. Starting processing from index ${startIndex}...`);

    const batchSize = 5;
    let processedCount = 0;

    for (let i = startIndex; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const results = await processBatch(batch);
      
      processedCount += batch.length;
      console.log(`Processed batch ${Math.ceil((i - startIndex) / batchSize) + 1}:`);
      console.log(results.join('\n'));
      console.log(`Progress: ${processedCount}/${data.length - startIndex} resources processed\n`);
    }

    console.log('All resources processed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example usage:
// main(); // Start from beginning
main(); // Start from index 100