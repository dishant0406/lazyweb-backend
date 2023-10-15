import mongoose from "mongoose";

const schema = new mongoose.Schema({
  created_at: {
    type: String,
    default: Date.now
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shortcut: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  snippetCode: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  }
});

const Snippet = mongoose.model('Snippet', schema);

export {
  Snippet
}