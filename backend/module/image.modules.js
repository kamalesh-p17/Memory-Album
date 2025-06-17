import mongoose, {Schema} from "mongoose";

const imageSchema = new mongoose.Schema({
    image_URL : String,
    model: String,
    width: Number,
    height: Number,
    time: String,
});

const eventSchema = new Schema({
    eventID : {
        type : Number,
        require: true,
    },
    eventName : {
        type : String,
        require : true
    },
    imageDetails : [imageSchema]
});

export const Event = mongoose.model("Event" , eventSchema);