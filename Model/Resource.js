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
  url: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  image_url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  desc: {
    type: String,
    default: ''
  },
  isPublicAvailable: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  isAvailableForApproval: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: ''
  },
  created_by_list: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarked_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const Resource = mongoose.model('Resource', schema);

export {
  Resource
}
