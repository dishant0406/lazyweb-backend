import { Resource } from "../../Model/Resource.js"
import { User } from "../../Model/User.js";

export const showAllWebsites = async (req, res) => {
  try {
    const resources = await Resource.find({ isPublicAvailable: true });
    res.json(resources);
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// Define an asynchronous function to add a website to the database
export const addWebsite = async (req, res) => {

  // Extract the user's email from the request object
  const { email } = req.user

  // Extract the URL, image URL, title, and description from the request body
  const { url, image_url, title, desc, isPublicAvailable, category, tags } = req.body

  // Find the user in the database based on their email
  const user = await User.findOne({ email })

  // If the user doesn't exist, send an error response and return from the function
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return
  }

  // Get the user's ID to use as a reference in the created_by field
  const created_by = user._id

  // Check if a resource with the same URL already exists in the database
  const alreadyWebsite = await Resource.findOne({ url })

  // If a resource with the same URL exists, add the user's ID to the created_by_list array
  if (alreadyWebsite) {
    const { created_by_list } = alreadyWebsite;
    if (created_by_list.includes(created_by)) {
      res.status(400).json({ error: "User already added this website" });
      return;
    } else {
      await Resource.findByIdAndUpdate({
        _id: alreadyWebsite._id
      }, {
        $push: { created_by_list: created_by }
      })
    }
  }

  // Create a new resource object using the input data
  const resource = new Resource({
    url,
    image_url,
    title,
    desc,
    created_by,
    created_by_list: [created_by],
    isPublicAvailable,
    category,
    tags
  })

  // Try to save the new resource to the database
  try {
    const newResource = await resource.save();
    // If the resource is saved successfully, send a response with the new resource data
    res.status(201).json(newResource);
  }
  catch (err) {
    // If there is an error saving the resource, send an error response with the error message
    res.status(400).json({ error: err.message });
  }
}


export const getUserWebsites = async (req, res) => {
  const { email } = req.user;

  // Find the user in the database based on their email
  const user = await User.findOne({ email });

  // If the user doesn't exist, send an error response and return from the function
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Get the user's ID to use as a reference in the created_by_list field
  const user_id = user._id;

  try {
    // Find all resources that were created by the user
    const userWebsites = await Resource.find({
      created_by_list: { $in: [user_id] }
    });

    // Send a response with the list of user's websites
    res.status(200).json(userWebsites);
  } catch (err) {
    // If there is an error retrieving the user's websites, send an error response with the error message
    res.status(500).json({ error: err.message });
  }
}

export const updateResource = async (req, res) => {
  const { resourceId } = req.params;
  const { category, tags } = req.body;

  try {
    let resource = await Resource.findById(resourceId);

    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    if (category) {
      resource.category = category;
    }

    if (tags) {
      if (typeof tags === "string") {
        resource.tags = tags.split(",");
      } else if (Array.isArray(tags)) {
        resource.tags = tags;
      }
    }

    if (tags && category) {
      resource.isAvailableForApproval = true;
    }

    const updatedResource = await resource.save();
    res.status(200).json(updatedResource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export const getResourcesByCategories = async (req, res) => {
  let { categories } = req.body;

  if (typeof categories === 'string') {
    categories = categories.split(',');
  }

  try {
    const resources = await Resource.find({ category: { $in: categories } });
    res.status(200).json(resources);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}


export const getResourcesByTags = async (req, res) => {
  let { tags } = req.body;

  if (typeof tags === 'string') {
    tags = tags.split(',');
  }

  try {
    const resources = await Resource.find({ tags: { $in: tags } });
    res.status(200).json(resources);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}





