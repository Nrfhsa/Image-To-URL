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

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }
    
    const fileHash = calculateFileHash(req.file.buffer);
    const existingFile = getExistingFileByHash(fileHash);
    let filename;

    if (existingFile) {
      filename = existingFile;
      console.log(`File duplikat terdeteksi: ${filename}`);
    } else {
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      filename = `${fileHash}${fileExt}`;
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
      saveFileHash(fileHash, filename);
      console.log(`File baru disimpan: ${filename}`);
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/image/${filename}`;
    res.status(200).json({
      success: true,
      message: existingFile ? 'File sudah ada' : 'Upload berhasil',
      imageUrl,
      isDuplicate: !!existingFile
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/files', (req, res) => {
  res.json(fileHashMap);
});

router.post('/webhook', (req, res) => {
  try {
    console.log('Webhook dari Railway diterima:', req.body);
    
    // Validasi payload jika diperlukan
    const payload = req.body;
    
    // Proses event berdasarkan jenisnya
    if (payload.type === 'DEPLOYMENT_SUCCEEDED') {
      console.log('Deployment berhasil:', payload.deployment?.id);
      // Lakukan tindakan yang diperlukan setelah deployment berhasil
    } else if (payload.type === 'DEPLOYMENT_FAILED') {
      console.log('Deployment gagal:', payload.deployment?.id);
      // Tangani kasus deployment gagal
    } else {
      console.log('Event webhook lainnya:', payload.type);
    }
    
    // Selalu kirim respons sukses
    res.status(200).json({
      success: true,
      message: 'Webhook diterima dan diproses'
    });
  } catch (error) {
    console.error('Error saat memproses webhook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal memproses webhook: ' + error.message 
    });
  }
});

router.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: err.message 
  });
});

module.exports = router;
