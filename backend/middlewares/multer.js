import multer from "multer";
import path from "path";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        // Specify the directory where files will be stored
        callback(null, path.join(__dirname, "../uploads")); // Ensure the "uploads" folder exists
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    },
});

const upload = multer({ storage });

export default upload;