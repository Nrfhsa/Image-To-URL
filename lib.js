const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const uploadDir = path.join(__dirname, 'public/images');
const hashMapFile = path.join(__dirname, 'file-hash-map.json');

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

const fileHashMap = {};

function calculateFileHash(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

function getExistingFileByHash(hash) {
  return fileHashMap[hash];
}

function saveFileHash(hash, filename) {
  fileHashMap[hash] = filename;
}

function initializeFileHashMap() {
  ensureUploadDir();
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    files.forEach(filename => {
      const filePath = path.join(uploadDir, filename);
      const fileBuffer = fs.readFileSync(filePath);
      const hash = calculateFileHash(fileBuffer);
      fileHashMap[hash] = filename;
    });
  }
}

function loadHashMapFromDisk() {
  if (fs.existsSync(hashMapFile)) {
    try {
      const data = fs.readFileSync(hashMapFile, 'utf8');
      Object.assign(fileHashMap, JSON.parse(data));
    } catch (error) {
      console.error('Error loading hash map:', error);
    }
  }
}

function saveHashMapToDisk() {
  fs.writeFileSync(hashMapFile, JSON.stringify(fileHashMap, null, 2));
}

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extValid = allowedTypes.test(path.extname(file.originalname));
  const mimeValid = allowedTypes.test(file.mimetype);
  if (extValid && mimeValid) return cb(null, true);
  cb(new Error('Hanya file gambar yang diperbolehkan'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = {
  ensureUploadDir,
  calculateFileHash,
  getExistingFileByHash,
  saveFileHash,
  initializeFileHashMap,
  loadHashMapFromDisk,
  saveHashMapToDisk,
  upload,
  uploadDir,
  fileHashMap
};
