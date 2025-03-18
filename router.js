const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { 
  upload,
  getExistingFileByHash,
  saveFileHash,
  calculateFileHash,
  uploadDir,
  fileHashMap
} = require('./lib');

/*==================== [ ROUTES ] ====================*/
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

router.post('/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    try {
      if (err) {
        const errorMap = {
          LIMIT_FILE_SIZE: { message: 'File size exceeds 5MB limit', status: 413 },
          INVALID_FILE_TYPE: { message: 'Invalid file type', status: 400 }
        };

        const errorInfo = errorMap[err.code] || { message: 'Upload failed', status: 500 };
        return res.status(errorInfo.status).json({ 
          success: false, 
          message: errorInfo.message 
        });
      }

      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

      const fileHash = calculateFileHash(req.file.buffer);
      const existingFile = getExistingFileByHash(fileHash);
      let filename;

      if (existingFile) {
        filename = existingFile;
        console.log(`[${req.requestTime}] DUPLICATE | IP: ${req.clientIP} | FILE ${filename}`);
      } else {
        const ext = path.extname(req.file.originalname).toLowerCase();
        filename = `${fileHash}${ext}`;
        fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
        saveFileHash(fileHash, filename);
        console.log(`[${req.requestTime}] UPLOAD | IP: ${req.clientIP} | FILE ${filename}`);
      }

      res.json({
        success: true,
        message: existingFile ? 'File already exists' : 'Upload successful',
        imageUrl: `${req.protocol}://${req.get('host')}/image/${filename}`,
        isDuplicate: !!existingFile,
        fileInfo: {
          filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });

    } catch (error) {
      console.error(`[${req.requestTime}] UPLOAD ERROR | IP: ${req.clientIP} | ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Upload processing failed',
        error: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }
  });
});

router.get('/files', (req, res) => {
  try {
    const files = Object.values(fileHashMap).map(filename => ({
      filename,
      url: `${req.protocol}://${req.get('host')}/image/${filename}`,
      ...fs.statSync(path.join(uploadDir, filename)),
      mimetype: getMimeType(path.extname(filename))
    })).sort((a, b) => b.birthtimeMs - a.birthtimeMs);

    console.log(`[${req.requestTime}] GET FILES | IP: ${req.clientIP}`);
    res.json({ 
      success: true, 
      count: files.length,
      files: files.map(f => ({
        filename: f.filename,
        url: f.url,
        size: f.size,
        uploadedAt: f.birthtime,
        mimetype: f.mimetype
      }))
    });
  } catch (error) {
    console.error(`[${req.requestTime}] FILES ERROR | IP: ${req.clientIP} | ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve files' 
    });
  }
});

/*==================== [ HELPER ] ====================*/
function getMimeType(ext) {
  return {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  }[ext.toLowerCase()] || 'application/octet-stream';
}

module.exports = router;