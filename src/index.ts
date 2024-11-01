import express, { Request, Response } from "express";
import client from "./database";
import bodyParser from "body-parser";
import cors from "cors";
import cloudinary from "cloudinary";
import { ObjectId } from "mongodb";

interface Post {
  title: string;
  description: string;
  postContent: string;
  image: string; // base64
  tags: string[];
  userId: string;
}

interface User {
  email: string;
  imageUrl: string;
  name: string;
}

interface UserUpdate {
  name?: string;
  bio?: string;
  heart?: string[];
}

const app = express();
const port = process.env.PORT || 3000;

const cloudinaryAPIKey = "161546517254883";
const cloudinaryAPISecret = "3nMQHcPk58V1SijwkNIzw7RjXd8";
const cloudinaryCloudName = "dkyfbbwlq";

app.use(express.json({
    limit: "50mb",
}));
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript Express!");
});

app.get("/posts", async (req: Request, res: Response) => {
  await client.connect();
  const database = client.db("moonboard");
  const posts = database.collection("posts");
  const users = database.collection("users");

  // ดึง Post ทั้งหมดจาก Database
  const allPosts = await posts.find().toArray();

  // ดึงข้อมูลของผู้ใช้ที่เขียน Post แต่ละ Post
  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i];
    const user = await users.findOne({ _id: new ObjectId(post.author) });
    allPosts[i].author = user;
  }

  res.json(allPosts).status(200);
});

app.get("/posts/:id", async (req: Request, res: Response) => {
  await client.connect();
  const database = client.db("moonboard");
  const posts = database.collection("posts");
  const users = database.collection("users");

  const id = req.params.id;
  // ดึง Post จาก Database ด้วย id 
  const post = await posts.findOne({ _id: new ObjectId(id) });

  // ดึงข้อมูลของผู้ใช้ที่เขียน Post นี้
  const user = await users.findOne({ _id: new ObjectId(post?.author) });
  if (post) {
    post.author = user;
  } else {
    res.status(404).send("Post not found");
    return;
  }

  // ส่ง Post กลับไปให้ Client
  res.json(post).status(200);
});

app.get("/users/:id", async (req: Request, res: Response) => {
  await client.connect();
  const database = client.db("moonboard");
  const users = database.collection("users");

  const id = req.params.id;
  const user = await users.findOne({ _id: new ObjectId(id) });

  res.json(user).status(200);
});

app.post("/post", async (req: Request, res: Response) => {
  await client.connect();
  const database = client.db("moonboard");
  const posts = database.collection("posts");

  const postData: Post = req.body;

  cloudinary.v2.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryAPIKey,
    api_secret: cloudinaryAPISecret,
  });

  try {
    const result = await cloudinary.v2.uploader.upload(postData.image);

    const newPost = {
      title: postData.title,
      description: postData.description,
      postContent: postData.postContent,
      imageUrl: result.url,
      author: postData.userId,
      tags: postData.tags,
    };

    await posts.insertOne(newPost);
    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading image");
  }
});

app.post("/login", async (req: Request, res: Response) => {
  await client.connect();
  const database = client.db("moonboard");
  const users = database.collection("users");

  const userData: User = req.body;

  const user = await users.findOne({ email: userData.email });

  if (user) {
    res.status(200).json(user);
    return;
  } 

  const newUser = {
    email: userData.email,
    imageUrl: userData.imageUrl,
    name: userData.name,
    bio: "",
    heart: [],
  };

  await users.insertOne(newUser);
  res.status(201).json(newUser);
});

app.patch("/users/:id", async (req: Request, res: Response) => {
  await client.connect();
  const database = client.db("moonboard");
  const users = database.collection("users");

  const id = req.params.id;
  const userData: UserUpdate = req.body;

  console.log(userData);

  const user = await users.findOne({ _id: new ObjectId(id) });

  if (!user) {
    res.status(404).send("User not found");
    return;
  }

  await users.updateOne({ _id: new ObjectId(id) }, { $set: userData });

  const updatedUser = await users.findOne({ _id: new ObjectId(id) });

  console.log(updatedUser);

  res.status(200).json(updatedUser);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
