const path = require('path');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const fs = require('fs');

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
            return res.status(400).send({ message: err.message });
        } else if (err) {
            return res.status(400).send({ message: err.message });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).send({ message: 'No files uploaded' });
        }

        const filePaths = req.files.map(file => `/uploads/${file.filename}`);
        res.send(filePaths);
    });
});

// @desc    Delete an image
// @route   DELETE /api/upload/:filename
// @access  Private (should be, but keeping simple for now matching project)
router.delete('/:filename', (req, res) => {
    const filename = req.params.filename;
    // Use process.cwd() to reliably target the project root's uploads folder
    const filePath = path.join(process.cwd(), 'uploads', filename);

    console.log(`[File Delete] Request to delete: ${filename}`);
    console.log(`[File Delete] Resolved path: ${filePath}`);

    // Prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
        console.log('[File Delete] Invalid filename');
        return res.status(400).json({ message: 'Invalid filename' });
    }

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`[File Delete] Error unlinking file: ${err}`);
                return res.status(500).json({ message: 'Could not delete file' });
            }
            console.log('[File Delete] Successfully deleted.');
            res.json({ message: 'File deleted successfully' });
        });
    } else {
        console.log('[File Delete] File not found at path.');
        res.status(404).json({ message: 'File not found' });
    }
});

module.exports = router;
