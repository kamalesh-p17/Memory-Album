import mongoose from "mongoose";

const connectDB = async() => {
    try {
        const connection = mongoose.connect(`${process.env.mongoDB_URL}/image`)
        console.log("MongoDB connected");
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export default connectDB;