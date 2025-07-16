const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testAPI() {
  try {
    console.log('🧪 Testing Job Scraper API...\n');

    // Test health check
    console.log('1. Testing health check...');
    const health = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check:', health.data);

    // Test getting companies
    console.log('\n2. Testing companies endpoint...');
    const companies = await axios.get(`${API_BASE_URL}/api/companies`);
    console.log('✅ Available companies:', companies.data.companies.length);

    // Test scraping with GET
    console.log('\n3. Testing GET scraping...');
    const getScrape = await axios.get(`${API_BASE_URL}/api/scrape`, {
      params: {
        company: 'microsoft.com',
        job: 'engineer',
        pages: 2
      }
    });
    console.log('✅ GET scrape results:', {
      totalJobs: getScrape.data.metadata.totalJobs,
      company: getScrape.data.metadata.company,
      job: getScrape.data.metadata.job
    });

    // Test scraping with POST
    console.log('\n4. Testing POST scraping...');
    const postScrape = await axios.post(`${API_BASE_URL}/api/scrape`, {
      company: 'google.com',
      job: 'developer',
      pages: 1
    });
    console.log('✅ POST scrape results:', {
      totalJobs: postScrape.data.metadata.totalJobs,
      company: postScrape.data.metadata.company,
      job: postScrape.data.metadata.job
    });

    console.log('\n🎉 All API tests passed!');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI }; 