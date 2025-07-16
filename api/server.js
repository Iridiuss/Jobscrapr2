const express = require('express');
const cors = require('cors');
const dispatcher = require('../src/dispatcher');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Single scraping endpoint
app.post('/api/scrape', async (req, res) => {
  try {
    const { company, job } = req.body;
    
    if (!company) {
      return res.status(400).json({ 
        error: 'Company parameter is required' 
      });
    }

    // Add .com to company name if not already present
    const companyDomain = company.includes('.com') ? company : `${company}.com`;

    console.log(`[API] Scraping: company=${companyDomain}, job=${job || 'all'}`);

    const options = {
      company: companyDomain,
      job: job || 'all'
    };

    const results = await dispatcher.scrapeJobs(options);
    
    console.log(`[API] Scraping completed: ${results.length} jobs found`);
    console.log(`[API] First 3 jobs:`, results.slice(0, 3));
    
    res.json({
      success: true,
      data: results,
      totalJobs: results.length
    });

  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({ 
      error: 'Scraping failed',
      message: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`🚀 Job Scraper API running on http://localhost:${PORT}`);
});

module.exports = app; 