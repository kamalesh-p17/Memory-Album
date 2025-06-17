import express from "express";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import cloudinaryModule from "cloudinary";
import { Event } from "./module/image.modules.js";
import upload from "./middlewares/multer.middleware.js";
import connectDB from "./db/connectDB.js";
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
const cloudinary = cloudinaryModule.v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// creating endpoint to upload multiple image and store image data in DB
app.use("/assets", express.static("assets"));
app.post("/upload", upload.array("images"), async (req, res) => {
  try {
    const eventID = req.body.eventID;
    const eventName = req.body.eventName;

    if (!eventName || !eventID) {
      return res.status(400).json({ success: false ,message: "event id or event name is missing" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const imageDetails = await Promise.all(
      req.files.map(async (file) => {
        const buffer = fs.readFileSync(file.path);
        const parser = ExifParser.create(buffer);
        const exifData = parser.parse();
        console.log(exifData);
        const timeStamp = exifData.tags.DateTimeOriginal;
        console.log(timeStamp);
        const formattedTime = timeStamp
          ? new Date(timeStamp * 1000).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })
          : "Timestamp not found";

        const uploaded = await cloudinary.uploader.upload(file.path);
        fs.unlinkSync(file.path); // Clean up file

        return {
          image_URL: uploaded.secure_url,
          model: exifData.tags.Model || "Unknown",
          width: exifData.imageSize?.width || -1,
          height: exifData.imageSize?.height || -1,
          time: formattedTime,
        };
      })
    );
    
    const event = new Event({
      eventID : eventID,
      eventName : eventName,
      imageDetails: imageDetails,
    });

    const savedEvent = await event.save();
    
    console.log(imageDetails);
    res.status(200).json({
      success: true,
      message: "Images uploaded and event saved",
      data: savedEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to upload and save event",
      error: error.message || error,
    });
  }
});

// Creating endpoint to get all Event details
app.get("/all_event",async(req,res) => {
  try {
    const all_event = await Event.aggregate([
      {
        $project : {
          _id : 0,
          eventID : 1,
          eventName : 1,
        }
      }
    ]);

    res.status(200).json({
      success : true,
      data : all_event
    })
  } catch (error) {
    res.status(500).json({
      success : false,
      error
    });
  }
});

//creating endpoint to get all imageurl using image id
app.get("/all_image/:id",async(req,res) => {
  try {
    const id = parseInt(req.params.id);

    const data = await Event.aggregate([
      { $match: { eventID: id } },
      { $project: { _id: 0, "imageDetails.image_URL": 1 } }
    ]);

    res.status(200).json({
      success : true,
      data : data
    });
  } catch (error) {
    res.status(500).json({
      success : false,
      error
    });
  }
});

//creating endpoint to get the image details using image url
app.post("/image_details",async(req,res)=> {
  try {
    const url = req.body.url;

    const data = await Event.findOne(
      {
      "imageDetails.image_URL" : url
      },
      {
        "imageDetails.$" : 1
      });
    res.status(200).json({
      success : true,
      data : data
    });
  } catch (error) {
    res.status(500).json({
      success : false,
      error
    })
  }
})



app.listen(PORT,"0.0.0.0",() => {
    console.log(`Server Running on Port : ${PORT}`);
});
