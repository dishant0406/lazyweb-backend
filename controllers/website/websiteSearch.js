import { Resource } from "../../Model/Resource.js"
import { User } from "../../Model/User.js";
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
    const allResources = await Resource.find();
    const tags = [...new Set(resources.reduce((tags, resource) => tags.concat(resource.tags.map(tag => tag.toLowerCase())), []))];
    const allTags = [...new Set(allResources.reduce((tags, resource) => tags.concat(resource.tags?.map(tag => tag?.toLowerCase())), []))].filter(tag => tag !== undefined);
    const categories = [...new Set(resources.reduce((categories, resource) => categories.concat(resource.category.toLowerCase()), []))];
    const allCategories = [...new Set(allResources.reduce((categories, resource) => categories.concat(resource.category?.toLowerCase()), []))].filter(category => category !== undefined);
    const today = new Date();
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    const index = daysSinceEpoch % resources.length;
    const dailyResource = resources.find((_, i) => i === index);

    res.json({ resources, allTags, allCategories, dailyResource, tags, categories });
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
    res.json({ resources });
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
    res.status(200).json({ userWebsites });
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
    res.status(200).json({ resources });
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
    res.status(200).json({ resources });
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
  res.status(200).json({ bookmarkedResources })
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
      { isPublicAvailable: true, isAvailableForApproval: false },
      { new: true }
    );
    res.status(200).json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * The function `rejectResource` updates the `isAvailableForApproval` field of a resource to `false` if
 * the user making the request is an admin.
 * @param req - The `req` parameter is an object that represents the HTTP request made to the server.
 * It contains information such as the request headers, request body, request parameters, and user
 * authentication details.
 * @param res - The `res` parameter is the response object that is used to send the response back to
 * the client. It contains methods and properties that allow you to control the response, such as
 * setting the status code, sending JSON data, or redirecting the client to another URL.
 * @returns a JSON response with the updated resource object if the user is an admin and the resource
 * is successfully updated. If there is an error, it returns a JSON response with the error message.
 */
export const rejectResource = async (req, res) => {
  const { resourceId } = req.params;
  const { isAdmin } = req.user;

  if (!isAdmin) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const resource = await Resource.findByIdAndUpdate(
      { _id: resourceId },
      { isAvailableForApproval: false },
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

/**
 * The function checks if a resource is bookmarked by a user.
 * @param req - The `req` parameter is the request object that contains information about the HTTP
 * request made by the client. It includes properties such as headers, query parameters, request body,
 * and user information.
 * @param res - The `res` parameter is the response object that is used to send the HTTP response back
 * to the client. It is an instance of the Express `Response` object and has methods like `status()`
 * and `json()` that are used to set the response status code and send JSON data back to the
 * @returns a JSON response with the property "bookmarked" indicating whether the resource is
 * bookmarked or not.
 */
export const checkIfResourceBookmarked = async (req, res) => {

  const { email } = req.user

  const user = await User.find({ email })

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return
  }

  const { resourceId } = req.params;

  try {
    const resource = await Resource.findById(resourceId)

    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return
    }

    const bookmarkIndex = resource.bookmarked_by.indexOf(user._id)

    if (bookmarkIndex === -1) {
      res.status(200).json({ bookmarked: false })
    }
    else {
      res.status(200).json({ bookmarked: true })
    }
  }
  catch (err) {
    res.status(500).json({ err: "Error in checking if resource is bookmarked" })
  }
}

/**
 * The function sets a resource as available for approval by updating its properties and returns the
 * updated resource.
 * @param req - The `req` parameter is an object that represents the HTTP request made to the server.
 * It contains information such as the request headers, request body, request parameters, and user
 * information.
 * @param res - The `res` parameter is the response object that is used to send the response back to
 * the client. It contains methods and properties that allow you to control the response, such as
 * setting the status code and sending JSON data.
 */
export const setResourceAvailableForApproval = async (req, res) => {
  const { resourceId } = req.params;
  const { isAdmin } = req.user;
  const { category, tags } = req.body;

  try {
    const resource = await Resource.findByIdAndUpdate(
      { _id: resourceId },
      { isAvailableForApproval: true, isPublicAvailable: false, category, tags },
      { new: true }
    );
    res.status(200).json(resource);
  }
  catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * The function `getResourcesThatMatchDescription` takes a description as input and returns a list of
 * resources that match the description.
 * @param req - The `req` parameter represents the HTTP request object, which contains information
 * about the incoming request from the client. It includes properties such as headers, body, query
 * parameters, and more.
 * @param res - The `res` parameter is the response object that is used to send the response back to
 * the client. It is an instance of the Express `Response` object and has methods like `status()` and
 * `json()` that are used to set the response status code and send JSON data back to the client
 */
export const getResourcesThatMatchDescription = async (req, res) => {
  const { desc } = req.body;

  try {
    const resources = await Resource.find(
      { isPublicAvailable: true },
      'title desc _id'
    );

    const nameWithDesc = resources.map(resource => ({
      nameDesc: `${resource.title} ${resource.desc}`,
      id: resource._id,
    }));

    // Prepare all the OpenAI API calls
    const apiCalls = nameWithDesc.map(async resource => {
      const prompt = `
      Your task is to critically evaluate whether the resource description is aligned with what the user is looking for. The user has a specific intent or need, which may not be expressed in exactly the same words as the resource description. Therefore, it's important to consider the context, any synonyms or closely related terms, as well as the potential utility of the resource in meeting the user's needs.
      
      To clarify:
      - Synonyms or related terms should be considered. For example, if the user is asking for "web icons," resources that offer "website pictograms" may also be relevant.
      - Think about the utility or applicability of the resource. Is it likely to serve the purpose the user has in mind?
      - Context is important. Try to understand the broader intent behind the user's query.
      
      User's Intent: ${desc}
      Resource Description: ${resource.nameDesc}
      
      Based on your understanding, does this resource align with what the user is likely looking for or might find useful? Respond with "true" if it aligns well and "false" if it does not. Please remember, your response should only be "true" or "false".
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-16k-0613',
        messages: [{
          role: 'user',
          content: prompt,
        }],
        temperature: 0.1
      });

      const { choices } = completion;
      const { message } = choices[0];
      return message.content.toLowerCase() === "true" ? resource.id : null;
    });

    // Execute all the OpenAI API calls in parallel
    const matchResults = await Promise.all(apiCalls);

    // Filter out the null values and retrieve the IDs that matched
    const resultIds = matchResults.filter(id => id !== null);

    // Fetch the final resources in a single query
    const finalResources = await Resource.find({
      '_id': { $in: resultIds }
    });

    res.status(200).json({ resources: finalResources });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



/**
 * The `generateUI` function takes a description as input and uses OpenAI's GPT-3.5 Turbo model to
 * generate HTML code with Tailwind CSS classes for a UI component based on the description.
 * @param req - The `req` parameter represents the HTTP request object, which contains information
 * about the incoming request such as headers, query parameters, and the request body.
 * @param res - The `res` parameter is the response object that is used to send the HTTP response back
 * to the client. It is an object that contains methods and properties for handling the response, such
 * as setting the status code, sending JSON data, or sending the generated UI component.
 * @returns a response to the client. If the description is missing, it returns a 400 status code with
 * an error message. If the UI generation is successful, it returns a 200 status code with the
 * generated UI. If there is an error during the process, it returns a 500 status code with an error
 * message.
 */
export const generateUI = async (req, res) => {
  try {
    const desc = req.body.desc;

    if (!desc) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // const completion = await openai.chat.completions.create({
    //   model: 'gpt-3.5-turbo',
    //   messages: [
    //     {
    //       role: 'system',
    //       content: 'You are a code generator specialized in creating raw HTML code with Tailwind CSS classes only. Your output should contain exclusively the HTML code, devoid of any comments, explanations, or inline styles.',
    //     },
    //     {
    //       role: 'user',
    //       content: `Strictly generate raw HTML code utilizing Tailwind CSS classes for the following UI component description: "${desc}". Exclude any and all comments, explanations, or additional text. Output HTML code only.`,
    //     },
    //   ],
    //   temperature: 0.1,
    //   //a max_tokens: 200, // Limit the length of the response
    // });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a specialized code generator that creates raw HTML code intended for the body of an HTML document. Use only Tailwind CSS classes for styling. Your output should contain exclusively HTML content appropriate for the <body> section, devoid of any comments, explanations, or inline styles.',
        },
        {
          role: 'user',
          content: `Strictly generate raw HTML code utilizing Tailwind CSS classes. Exclude any and all comments, explanations, or additional text. Output HTML code only. Generate only the raw HTML content appropriate for the <body> section of an HTML document, utilizing Tailwind CSS classes, based on the following UI component description: "${desc}". Exclude any headers, footers, doctype declarations, comments, or any other elements that do not belong inside the <body> tag.`,
        },
      ],
      temperature: 0.1,
      // max_tokens: 200, // Limit the length of the response
    });

    const generatedUI = completion.choices[0]?.message?.content?.trim();

    if (!generatedUI) {
      return res.status(500).json({ error: 'Failed to generate UI' });
    }

    return res.status(200).send(generatedUI);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


/**
 * The function deletes all resources and returns a success message or an error message if there is an
 * issue.
 * @param req - The `req` parameter is the request object, which contains information about the
 * incoming HTTP request such as headers, query parameters, and request body. It is used to retrieve
 * data from the client and pass it to the server.
 * @param res - The `res` parameter is the response object that is used to send the response back to
 * the client. It contains methods and properties that allow you to control the response, such as
 * setting the status code, sending JSON data, or sending an error message.
 */
export const deleteAllResources = async (req, res) => {
  try {
    await Resource.deleteMany({});
    res.status(200).json({ message: "All resources deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * The function retrieves all resources that have been bookmarked by a specific user.
 * @param req - The `req` parameter is the request object that contains information about the incoming
 * HTTP request, such as the request headers, request body, and request parameters.
 * @param res - The `res` parameter is the response object that is used to send the HTTP response back
 * to the client. It is an instance of the Express `Response` object and has methods like `status()`
 * and `json()` that are used to set the response status code and send JSON data back to the
 */
export const getUserBookmarkedResources = async (req, res) => {
  const { id } = req.params;
  try {
    const resources = await Resource.find({ bookmarked_by: { $in: [id] } });
    res.status(200).json({ resources });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export const bulkBookmarkResources = async (req, res) => {
  const { email } = req.user;
  const { resourceIds } = req.body;

  // Fetch resources by IDs
  const resources = await Resource.find({ _id: { $in: resourceIds } });

  if (!resources || resources.length === 0) {
    res.status(404).json({ error: "Resources not found" });
    return;
  }

  // Fetch user by email
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const userId = user._id;

  // Filter out resources that are already bookmarked by the user
  const resourcesToBookmark = resources.filter(resource => {
    return !resource.bookmarked_by.includes(userId);
  });

  // If no resources to bookmark, send a message
  if (resourcesToBookmark.length === 0) {
    res.status(200).json({ success: true, message: "No new resources to bookmark" });
    return;
  }

  const resourcesToBookmarkIds = resourcesToBookmark.map(resource => resource._id);

  try {
    // Bookmark resources
    await Resource.updateMany(
      { _id: { $in: resourcesToBookmarkIds } },
      { $addToSet: { bookmarked_by: userId } }
    );
    res.status(200).json({ success: true, message: "Resources bookmarked" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};





