# Job Scraper API

A REST API for scraping job listings from various company career pages using Puppeteer.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the API Server
```bash
npm start
```

The API will be available at `http://localhost:3000`

### 3. Test the API
```bash
node api/test-client.js
```

## 📚 API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "Job Scraper API"
}
```

### Get Available Companies
```http
GET /api/companies
```

**Response:**
```json
{
  "success": true,
  "companies": [
    "microsoft.com",
    "meta.com",
    "nvidia.com",
    "amazon.com",
    "accenture.com",
    "capgemini.com",
    "ibm.com",
    "adobe.com",
    "google.com",
    "apple.com",
    "wipro.com",
    "oracle.com",
    "sap.com",
    "infosys.com"
  ],
  "total": 14
}
```

### Scrape Jobs (GET)
```http
GET /api/scrape?company=microsoft.com&job=engineer&pages=5
```

**Parameters:**
- `company` (required): Company domain (e.g., microsoft.com)
- `job` (optional): Job keyword to search for
- `pages` (optional): Number of pages to scrape (default: 5)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "title": "Software Engineer",
      "location": "Redmond, WA",
      "url": "https://jobs.careers.microsoft.com/global/en/job/1234567"
    }
  ],
  "metadata": {
    "company": "microsoft.com",
    "job": "engineer",
    "pages": 5,
    "totalJobs": 25,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Scrape Jobs (POST)
```http
POST /api/scrape
Content-Type: application/json

{
  "company": "microsoft.com",
  "job": "engineer",
  "pages": 5
}
```

**Request Body:**
- `company` (required): Company domain
- `job` (optional): Job keyword
- `pages` (optional): Number of pages (default: 5)

**Response:** Same as GET endpoint

## 🔧 Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Scrape Microsoft jobs
const response = await axios.post('http://localhost:3000/api/scrape', {
  company: 'microsoft.com',
  job: 'engineer',
  pages: 5
});

console.log(response.data.data); // Array of jobs
```

### Python
```python
import requests

# Scrape Google jobs
response = requests.post('http://localhost:3000/api/scrape', json={
    'company': 'google.com',
    'job': 'developer',
    'pages': 3
})

jobs = response.json()['data']
print(f"Found {len(jobs)} jobs")
```

### cURL
```bash
# GET request
curl "http://localhost:3000/api/scrape?company=microsoft.com&job=engineer&pages=5"

# POST request
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"company":"microsoft.com","job":"engineer","pages":5}'
```

## 🛠️ Development

### Start in Development Mode
```bash
npm run dev
```

This uses nodemon for automatic restart on file changes.

### Environment Variables
- `PORT`: Server port (default: 3000)

### API Documentation
Visit `http://localhost:3000/api/docs` for interactive API documentation.

## 📊 Supported Companies

| Company | Domain | 5-Page Pagination | URL Extraction | Date Posted |
|---------|--------|-------------------|----------------|-------------|
| Microsoft | microsoft.com | ✅ | ✅ | ❌ |
| Meta | meta.com | ✅ | ✅ | ❌ |
| NVIDIA | nvidia.com | ✅ | ✅ | ❌ |
| Amazon | amazon.com | ✅ | ✅ | ❌ |
| Accenture | accenture.com | ✅ | ✅ | ❌ |
| Capgemini | capgemini.com | ✅ | ✅ | ❌ |
| IBM | ibm.com | ✅ | ✅ | ❌ |
| Adobe | adobe.com | ✅ | ✅ | ❌ |
| Google | google.com | ❌ (Signup wall) | ❌ | ❌ |
| Apple | apple.com | ✅ | ✅ | ❌ |
| Wipro | wipro.com | ✅ | ✅ | ❌ |
| Oracle | oracle.com | ✅ | ✅ | ❌ |
| SAP | sap.com | ✅ | ✅ | ❌ |
| Infosys | infosys.com | ✅ | ❌ | ❌ |

## ⚠️ Important Notes

1. **Google Careers**: Limited to 1 page due to signup/login requirements
2. **Rate Limiting**: Consider implementing rate limiting for production use
3. **Error Handling**: API returns appropriate HTTP status codes and error messages
4. **CORS**: API supports cross-origin requests
5. **Security**: Uses Helmet.js for security headers

## 🚀 Production Deployment

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
```bash
PORT=3000
NODE_ENV=production
```

## 📝 License

ISC License 