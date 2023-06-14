import { Resource } from "../../Model/Resource.js"
import { User } from "../../Model/User.js";

/**
 * This function retrieves all public available resources, their tags and categories, and a daily
 * resource based on the current date.
 * @param req - The `req` parameter is the request object representing the HTTP request made to the
 * server. It contains information about the request such as the HTTP method, headers, and any data
 * sent in the request body.
 * @param res - The `res` parameter is the response object that will be sent back to the client with
 * the requested data or error message. It is an instance of the `http.ServerResponse` class in Node.js
 * and contains methods for sending the response back to the client, such as `res.json()` and `
 */
export const showAllWebsites = async (req, res) => {
  try {
    const resources = await Resource.find({ isPublicAvailable: true });
    const allTags = [...new Set(resources.reduce((tags, resource) => tags.concat(resource.tags.map(tag => tag.toLowerCase())), []))];
    const allCategories = [...new Set(resources.reduce((categories, resource) => categories.concat(resource.category.toLowerCase()), []))];
    const today = new Date();
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    const index = daysSinceEpoch % resources.length;
    const dailyResource = resources.find((_, i) => i === index);

    res.json({ resources, allTags, allCategories, dailyResource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * This function retrieves all resources that are available for approval.
 * @param req - req stands for "request" and it is an object that contains information about the HTTP
 * request that was made to the server. It includes information such as the request method, headers,
 * URL, and any data that was sent in the request body. In this case, the function is using the request
 * object
 * @param res - `res` is the response object that is used to send the response back to the client
 * making the request. It is an instance of the Express `Response` object and has methods like `json()`
 * to send JSON responses, `send()` to send plain text responses, and `status()` to set
 */
export const showIsAvailableForApproval = async (req, res) => {
  try {
    const resources = await Resource.find({ isAvailableForApproval: true });
    res.json(resources);
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * This function adds a new website resource to the database, with information such as URL, image URL,
 * title, description, and tags, and associates it with the user who added it.
 * @param req - req is the request object that contains information about the incoming HTTP request,
 * such as the request headers, request parameters, request body, and user authentication details.
 * @param res - `res` is the response object that will be sent back to the client with the result of
 * the API request. It is used to send HTTP responses with status codes and data.
 * @returns The function does not explicitly return anything, but it sends a response to the client
 * using the `res` object. The response can be either a success response with the new resource data
 * (status code 201) or an error response with an error message (status code 400 or 404).
 */
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

/**
 * This function retrieves a list of websites created by a user based on their email.
 * @param req - req stands for request and it is an object that contains information about the HTTP
 * request that was made, such as the request method, headers, URL, and any data that was sent with the
 * request. It is passed as a parameter to the function.
 * @param res - `res` is the response object that is used to send a response back to the client making
 * the request. It contains methods such as `status` to set the HTTP status code of the response, and
 * `json` to send a JSON response body.
 * @returns This code defines an asynchronous function called `getUserWebsites` that takes in a request
 * object (`req`) and a response object (`res`).
 */
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

/**
 * This function updates a resource's category and tags, and sets a flag if both are updated, returning
 * the updated resource or an error message.
 * @param req - The `req` parameter is an object that represents the HTTP request made to the server.
 * It contains information such as the request method, headers, URL, and any data sent in the request
 * body.
 * @param res - The `res` parameter is the response object that will be sent back to the client with
 * the updated resource or an error message. It contains methods to set the HTTP status code and send
 * the response data.
 * @returns This function returns a JSON response with the updated resource object if the update is
 * successful, or a JSON response with an error message if there is an error.
 */
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

/**
 * This function retrieves resources based on categories provided in the request body.
 * @param req - req stands for request and it is an object that contains information about the incoming
 * HTTP request such as the request headers, request parameters, request body, etc.
 * @param res - `res` is the response object that is used to send the response back to the client. It
 * is an instance of the Express `Response` object and has methods like `status()` and `json()` that
 * are used to set the HTTP status code and send the response data in JSON format, respectively
 */
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

/**
 * This function retrieves resources based on tags provided in the request body.
 * @param req - req stands for request and it is an object that contains information about the incoming
 * HTTP request such as the request headers, request parameters, request body, etc.
 * @param res - The `res` parameter is the response object that is used to send the HTTP response back
 * to the client. It contains methods like `status()` to set the HTTP status code, `json()` to send a
 * JSON response, and many others.
 */
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

/**
 * This function allows a user to bookmark or unbookmark a resource and updates the resource's
 * bookmarked_by list accordingly.
 * @param req - req stands for "request" and it contains information about the incoming HTTP request,
 * such as the request parameters, headers, and body.
 * @param res - `res` is the response object that is used to send the HTTP response back to the client.
 * It contains methods like `status()` to set the HTTP status code, `json()` to send a JSON response,
 * and `send()` to send a plain text response.
 * @returns a JSON response with the updated resource object, including the `bookmarked_by` list that
 * may have been modified by adding or removing the user ID. If there is an error, the function returns
 * a JSON response with an error message.
 */
export const bookmarkResource = async (req, res) => {
  const { resourceId } = req.params;
  const { email } = req.user;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    const bookmarkIndex = resource.bookmarked_by.indexOf(user._id);

    if (bookmarkIndex === -1) {
      // Add the user ID to the `bookmarked_by` list
      resource.bookmarked_by.push(user._id);
    } else {
      // Remove the user ID from the `bookmarked_by` list
      resource.bookmarked_by.splice(bookmarkIndex, 1);
    }

    await resource.save();

    res.status(200).json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * This function retrieves all resources bookmarked by a user based on their email.
 * @param req - req stands for request and it is an object that contains information about the HTTP
 * request that was made, such as the request headers, query parameters, and request body. It is passed
 * as a parameter to the function.
 * @param res - `res` is the response object that is used to send a response back to the client making
 * the request. It is an instance of the Express `Response` object and contains methods like `status()`
 * and `json()` that are used to set the HTTP status code and send a JSON response, respectively
 * @returns This code returns a list of resources that have been bookmarked by a user with the email
 * specified in the request. If the user is not found, it returns a 404 error. The list of bookmarked
 * resources is returned as a JSON object with a 200 status code.
 */
export const getResourcesBookmarkedByUser = async (req, res) => {
  const { email } = req.user
  console.log(req.user)
  const user = await User.findOne({ email })
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return
  }
  const bookmarkedResources = await Resource.find({ bookmarked_by: { $in: [user._id] } })
  res.status(200).json(bookmarkedResources)
}

/**
 * This function sets the public availability of a resource to true if the user making the request is
 * an admin.
 * @param req - req stands for request and it is an object that contains information about the HTTP
 * request that was made, such as the request parameters, headers, and body. It is passed as a
 * parameter to the setPublicAvailability function.
 * @param res - `res` is the response object that is used to send the response back to the client
 * making the request. It contains methods like `status()` to set the HTTP status code of the response,
 * `json()` to send a JSON response, and many others.
 * @returns This function returns a JSON response with the updated resource object if the update is
 * successful, or a JSON response with an error message if the update fails.
 */
export const setPublicAvailability = async (req, res) => {
  const { resourceId } = req.params;
  const { isAdmin } = req.user;

  if (!isAdmin) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const resource = await Resource.findByIdAndUpdate(
      { _id: resourceId },
      { isPublicAvailable: true },
      { new: true }
    );
    res.status(200).json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * This function retrieves all unique tags from public resources and returns them as an array.
 * @param req - req stands for request and it is an object that contains information about the HTTP
 * request that was made, such as the request headers, query parameters, and request body.
 * @param res - `res` is the response object that is used to send the response back to the client. It
 * is an instance of the Express `Response` object and has methods like `status`, `json`, `send`, etc.
 * that are used to set the response status code, headers, and body.
 */
export const getAllTags = async (req, res) => {
  try {
    const resources = await Resource.find({ isPublicAvailable: true });
    const allTags = resources.reduce((tags, resource) => {
      //convert into lowercase first
      const lowercaseTags = resource.tags?.map((tag) => tag.toLowerCase());
      return tags.concat(lowercaseTags);
    }, []);
    const uniqueTags = [...new Set(allTags)];
    res.status(200).json(uniqueTags);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * This function retrieves all unique categories from public resources.
 * @param req - req stands for "request" and it is an object that represents the HTTP request made by
 * the client to the server. It contains information about the request such as the URL, headers, query
 * parameters, and body. In this specific function, the req parameter is not used, but it is included
 * as
 * @param res - `res` is the response object that is used to send the response back to the client. It
 * is an instance of the `Response` class from the Express.js framework. The `res` object has methods
 * like `status()` to set the HTTP status code of the response, `json()` to
 */
export const getAllCategories = async (req, res) => {
  try {
    const resources = await Resource.find({ isPublicAvailable: true });
    const allCategories = resources.reduce((categories, resource) => {
      //lowercase first
      const lowercaseCategory = resource.category?.toLowerCase();
      return categories.concat(lowercaseCategory);
    }, []);
    const uniqueCategories = [...new Set(allCategories)];
    res.status(200).json(uniqueCategories);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * This function allows a user to like or unlike a resource and updates the resource's like count
 * accordingly.
 * @param req - req stands for request and it is an object that contains information about the HTTP
 * request that was made, such as the request headers, request parameters, request body, etc. It is
 * passed as a parameter to the likeAResource function.
 * @param res - `res` is the response object that is used to send the response back to the client
 * making the request. It contains methods like `status` and `json` that are used to set the HTTP
 * status code and send the response data in JSON format, respectively.
 * @returns a JSON response with the updated resource object if the resource is found and the
 * like/unlike operation is successful. If the user or resource is not found, or there is an error in
 * the operation, the function returns an error JSON response with an appropriate message.
 */
export const likeAResource = async (req, res) => {
  const { email } = req.user
  console.log(req.user)
  const user = await User.findOne({ email })
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return
  }
  const { resourceId } = req.params;
  try {
    //check if user already liked the resouce
    const resource = await Resource.findById(resourceId)
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return
    }
    const likeIndex = resource.liked_by.indexOf(user._id)
    if (likeIndex === -1) {
      resource.liked_by.push(user._id)
      //increase resouce likes count by 1
      resource.likes += 1
    }
    else {
      resource.liked_by.splice(likeIndex, 1)
      //descrease like count
      resource.likes -= 1
    }
    await resource.save()
    res.status(200).json(resource)
  }
  catch (err) {
    res.status(500).json({ err: "Error in Liking the resource" })
  }
}






