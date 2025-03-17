const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const router = require('./router');
const { 
  initializeFileHashMap,
  loadHashMapFromDisk,
  saveHashMapToDisk
} = require('./lib');

app.use(express.json());
app.set('json spaces', 2);
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/image', express.static(path.join(__dirname, 'public/images')));

app.use('/', router);

initializeFileHashMap();
loadHashMapFromDisk();

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

setInterval(saveHashMapToDisk, 5 * 60 * 1000);
process.on('SIGINT', () => {
  saveHashMapToDisk();
  process.exit(0);
});
