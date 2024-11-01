import { MongoClient, ServerApiVersion } from "mongodb";
const uri = "mongodb+srv://65050777:mG0kbutnhe@moonboard.ngmsj.mongodb.net/?retryWrites=true&w=majority&appName=moonboard";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export default client;