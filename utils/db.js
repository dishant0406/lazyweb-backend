//connect to mongodb database function es6 using import
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

/**
 * This function connects to a MongoDB database using the provided URI and logs a message indicating
 * successful connection.
 */
export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      //options
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
}


