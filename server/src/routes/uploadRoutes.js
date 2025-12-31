const path = require('path');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    },
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Images only! (jpg, jpeg, png)'));
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 2000000 }, // 2MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

router.post('/', (req, res) => {
    // 'images' is the field name, max 5 files
    upload.array('images', 5)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).send({ message: err.message });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).send({ message: err.message });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).send({ message: 'No files uploaded' });
        }

        // Return array of file paths
        const filePaths = req.files.map(file => `/uploads/${file.filename}`);
        res.send(filePaths);
    });
});

module.exports = router;
