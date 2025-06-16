import express from "express";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import upload from "./middlewares/multer.middleware.js";
import connectDB from "./db/connectDB.js";
import sharp from "sharp";
import ExifParser from "exif-parser";

const app = express();
dotenv.config();

app.use(express.json());
app.use(cors());

const PORT  = process.env.PORT || 5001;

connectDB()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// API creation
app.get("/", (req, res) => {
  res.send("Express App is Running");
});
app.use("/assets", express.static("assets"));
app.post("/upload", upload.array("images"), (req, res) => {
    console.log("hello");
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
    }
    const temp = req.files.map(async(file) => {
      const buffer = fs.readFileSync(file.path);
      const parser = ExifParser.create(buffer);
      const exifData = parser.parse();
      
      console.log(exifData);
      const image_Details = {
        Model : exifData.tags.Model,
        Width : exifData.imageSize.width,
        Height : exifData.imageSize.height,

      }
      console.log("======================");
    });
    console.log(temp);
    res.json({
        message: "Files uploaded successfully!",
    });
});

app.listen(PORT,"0.0.0.0",() => {
    console.log(`Server Running on Port : ${PORT}`);
});
