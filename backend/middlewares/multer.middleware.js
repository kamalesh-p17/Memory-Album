import multer from "multer";
import path from "path";

// Set up Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "assets/uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + "-" + Math.round(Math.random() * 100000) + path.extname(file.originalname));    
    },
});

const upload = multer({
    storage: storage,
});

export default upload;