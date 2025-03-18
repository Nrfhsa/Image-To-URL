const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const uploadDir = path.join(__dirname, 'public/images');
const hashMapFile = path.join(__dirname, 'file-hash-map.json');
const maxFileSize = 5 * 1024 * 1024;

/*==================== [ DIRECTORY INIT ] ====================*/
function initializeFileHashMap() {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    }
    console.log(`Upload directory initialized: ${uploadDir}`);
  } catch (error) {
    console.error('Directory initialization failed:', error);
    process.exit(1);
  }
}

/*==================== [ FILE FILTER ] ====================*/
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('INVALID_FILE_TYPE');
    error.code = 'INVALID_FILE_TYPE';
    cb(error);
  }
};

/*==================== [ STORAGE ] ====================*/
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxFileSize }
});

/*==================== [ HASH MAP MANAGEMENT ] ====================*/
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

function loadHashMapFromDisk() {
  try {
    if (fs.existsSync(hashMapFile)) {
      const data = fs.readFileSync(hashMapFile, 'utf8');
      Object.assign(fileHashMap, JSON.parse(data));
      console.log(`Loaded hash map with ${Object.keys(fileHashMap).length} entries`);
    }
  } catch (error) {
    console.error('Error loading hash map:', error);
  }
}

function saveHashMapToDisk() {
  try {
    fs.writeFileSync(hashMapFile, JSON.stringify(fileHashMap, null, 2));
    console.log(`Hash map saved (${Object.keys(fileHashMap).length} entries)`);
  } catch (error) {
    console.error('Error saving hash map:', error);
  }
}

/*==================== [ MIDDLEWARE API KEY ] ====================*/
const validateApiKey = (req, res, next) => {
  const providedKey = req.query.apikey || req.headers['x-api-key'];
  const validKey = process.env.API_KEY;

  if (!validKey) {
    console.error('API_KEY is not set in .env');
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  if (providedKey === validKey) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Invalid API key' });
  }
};

module.exports = {
  initializeFileHashMap,
  loadHashMapFromDisk,
  saveHashMapToDisk,
  calculateFileHash,
  getExistingFileByHash,
  saveFileHash,
  upload,
  uploadDir,
  fileHashMap, 
  validateApiKey
};