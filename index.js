const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
// MODELS
const User = require("./models/User");
const PostModel = require("./models/Post")

const bcrypt = require("bcryptjs");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const salt = bcrypt.genSaltSync(10);
const secret = "jh761289e0w8uiygflkjhgtfre4567898iuhygfre45678ve";

const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const fs = require("fs");

// Middleware
app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(express.json());
app.use(cookieParser());
// To save all the static files from the upload folder
app.use("/uploads", express.static(__dirname + "/uploads"))

mongoose.connect(
  "mongodb+srv://myMernBlog:MernBlogAPIMongoDB@cluster0.hyodqky.mongodb.net/?retryWrites=true&w=majority"
);

// For Registration!!!
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (err) {
    res.status(400).json(err);
  }
});

// For Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);

  if (passOk) {
    // Logged in
    jwt.sign({ username, id: userDoc._id }, secret, (err, token) => {
      if (err) throw err;
      // res.json(token);
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json("Wrong Credentials");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});

// FOR LOGOUT
app.post("/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

// FOR CREATE POST
app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  // To rename the file with its extention
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);

  // TO USE THE POST MODEL
  const { token } = req.cookies;
  jwt.verify(token, secret, async (err, info) => {
    if (err) throw err;

    const { title, summary, content } = req.body;
    const postDoc = await PostModel.create({
      title,
      summary,
      content,
      fileCover: newPath,
      author: info.id,
    });
    res.json(postDoc);
  });
});

// TO GET THE CREATED POST TO ANY PART OF THE SCREEN e.g Home Page
app.get("/post", async (req, res) => {
  const eachPost = await PostModel.find()
    .populate("author", ["username"])
    .sort({createdAt: -1})
    .limit(20)
  res.json(eachPost);
});

app.listen(4000, () => {
  console.log("Server is running!");
});  
