import { Snippet } from "../../Model/Snippet.js"
import { User } from "../../Model/User.js";
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


/**
 * The `createSnippet` function creates a new snippet with the provided shortcut, description, snippet
 * code, and language, and associates it with the user who made the request.
 * @params shortcut, description, snippetCode, language
 * @returns snippet
 * @access Private
 */
export const createSnippet = async (req, res) => {
  try {
    const { shortcut, description, snippetCode, language } = req.body;
    const { id: _id } = req.user;
    const snippet = await Snippet.create({
      created_by: _id,
      shortcut,
      description,
      snippetCode,
      language
    });
    res.status(201).json({ snippet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const createSnippetWithAI = async (req, res) => {
  try {
    const { shortcut, snippetCode, language } = req.body;
    const { id: _id } = req.user;

    console.log(JSON.stringify(req.user))

    const prompt = `I have a code snippet give a description for the snippet in english and easy words. don't include anything else but the description for the snippet in the response. the snippet is ${snippetCode} . ONLY INCLUDE THE DESCRIPTION FOR THE CODE IN RESPONSE`

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

    const snippet = await Snippet.create({
      created_by: _id,
      shortcut,
      snippetCode,
      language,
      description: message.content
    });
    res.status(201).json({ snippet, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error)
  }
}

/**
 * The `getAllSnippets` function returns all the snippets in the database.
 * @params none
 * @returns snippets
 * @access Public
 */
export const getAllSnippets = async (req, res) => {
  try {
    const snippets = await Snippet.find({});
    res.status(200).json({ snippets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * The `getSnippetById` function returns the snippet with the provided id.
 * @params id
 * @returns snippet
 * @access Public
 */
export const getSnippetById = async (req, res) => {
  try {
    const { id } = req.params;
    const snippet = await Snippet.findById(id);
    res.status(200).json({ snippet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * The `getMySnippets` function returns all the snippets created by the user who made the request.
 * @params none
 * @returns snippets
 * @access Private
 */
export const getMySnippets = async (req, res) => {
  try {
    const { id: _id } = req.user;
    const snippets = await Snippet.find({ created_by: _id });
    res.status(200).json({ snippets, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
