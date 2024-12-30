import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import 'dotenv/config'

const uri = process.env.mongoURI as string;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db: Db | null = null;

export const connectToMongoDB = async () => {
  try {
    await client.connect();
    db = client.db('Music');
    console.log('Connected to MongoDB!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

export const getDB = () => db;
