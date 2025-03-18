# Image Upload Service

A simple Node.js service for handling image uploads with duplicate detection and secure access management.

## Features

- API key authentication for sensitive endpoints
- Image upload with automatic duplicate detection via MD5 hash
- Rate limiting to prevent abuse
- Delete functionality for individual or all files
- Support for JPG, PNG, GIF, and WebP formats
- File size limit of 5MB
- Persistent hash mapping for duplicate detection across restarts

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Nrfhsa/Image-To-URL.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```env
   PORT=3000
   FRONTEND_URL=http://your-frontend-url.com
   API_KEY=your_secret_key_here
   ```

## Usage

Start the server:
```bash
node index.js
```

The server will run on port 3000 by default or the port specified in your `.env` file.

## API Endpoints

### Upload Image
```http
POST /upload
```
- Request: `multipart/form-data` with field name `image`
- Response: JSON with image URL and duplicate status

### List Files (Protected)
```http
GET /files?apikey={your_api_key}
```
or
```http
GET /files
x-api-key: {your_api_key}
```
- Response: JSON array of all uploaded files with metadata

### Delete Files (Protected)
```http
GET /delete?apikey={your_api_key}&image={all|filename}
```
Parameters:
- `image=all` - Delete all files
- `image={filename}` - Delete specific file

### View Image
```http
GET /image/{filename}
```
- Response: Image file

## Security Considerations

- Store API_KEY securely in environment variables
- Never hardcode API keys in source code
- Use HTTPS in production
- Rotate API keys periodically
- Revoke compromised API keys immediately

## Directory Structure

- `public/images/`: Uploaded images directory
- `file-hash-map.json`: File hash storage

## Technical Notes

- File hashes are saved every 5 minutes and on server shutdown
- API key validation uses environment variables
- Authentication via query parameter or `x-api-key` header
- Images are stored with MD5 hash filenames
- Rate limiting: 100 requests per 15 minutes

## Example Usage

### Upload Image (Node.js)
```javascript
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function uploadFile(path) {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(path));

    const response = await axios.post('http://localhost:3000/upload', formData, {
      headers: formData.getHeaders()
    });

    console.log(response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

uploadFile('./image.png');
```

**Example Output (Success):**
```json
{
  "success": true,
  "message": "Upload successful",
  "imageUrl": "http://localhost:3000/image/bb04d77a846e6beca811c4be1d8e3442.png",
  "isDuplicate": false,
  "fileInfo": {
    "filename": "bb04d77a846e6beca811c4be1d8e3442.png",
    "size": 7249,
    "mimetype": "image/png"
  }
}
```

**Example Output (Error):**
```json
{
  "success": false,
  "message": "File size exceeds 5MB limit"
}

{
  "success": false,
  "message": "Invalid file type"
}

{
  "success": false,
  "message": "Upload failed"
}

{
  "success": false,
  "message": "Upload processing failed", 
  "error": "${error.message}"
}
```

### List Files (cURL)
```bash
curl "http://localhost:3000/files?apikey=your_api_key"
```

**Example Output (Success):**
```json
{
  "success": true,
  "count": 2,
  "files": [
    {
      "filename": "bb04d77a846e6beca811c4be1d8e3442.png",
      "url": "http://localhost:3000/image/bb04d77a846e6beca811c4be1d8e3442.png",
      "size": 7249,
      "uploadedAt": "2023-10-15 14:30:45",
      "mimetype": "image/png"
    },
    {
      "filename": "a1b2c3d4e5f6g7h8i9j0.jpg",
      "url": "http://localhost:3000/image/a1b2c3d4e5f6g7h8i9j0.jpg",
      "size": 10240,
      "uploadedAt": "2023-10-15 12:15:30",
      "mimetype": "image/jpeg"
    }
  ]
}
```

**Example Output (Error):**
```json
{
  "success": false,
  "message": "Failed to retrieve files"
}
```

### Delete Files (cURL)
Delete specific file:
```bash
curl "http://localhost:3000/delete?apikey=your_api_key&image=bb04d77a846e6beca811c4be1d8e3442.png"
```

Delete all files:
```bash
curl "http://localhost:3000/delete?apikey=your_api_key&image=all"
```

**Example Output (Success):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}

{
  "success": true,
  "message": "All files deleted successfully"
}
```

**Example Output (Error):**
```json
{
  "success": false,
  "message": "File not found"
}

{
  "success": false,
  "message": "Delete operation failed", 
  "error": "${error.message}"
}
```