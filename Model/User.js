import mongoose from "mongoose";
import { Schema } from "mongoose";
import dotenv from "dotenv";
dotenv.config();


const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  codeGenerated: {
    type: Array,
    default: []
  }
});

//export
export const User = mongoose.model("User", UserSchema);

