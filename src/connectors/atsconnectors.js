// src/connectors/atsConnectors.js
const axios = require('axios');
const xhrConfig = require('../utils/config/xhrConfig.json');

async function fetchXhrApi(domain, keyword) {
  try {
    const cfg = xhrConfig[domain];
    if (!cfg) {
      console.error(`No XHR config found for domain: ${domain}`);
      return [];
    }

    const url = cfg.url.replace('{keyword}', encodeURIComponent(keyword));
    console.log(`Fetching from: ${url}`);
    
    const options = { method: cfg.method, url };
    const res = await axios(options);
    
    console.log(`Response status: ${res.status}`);
    console.log(`Response data keys:`, Object.keys(res.data));
    
    let items;
    if (cfg.itemsPath === "") {
      // Response is directly an array
      items = res.data;
      console.log('DEBUG: typeof res.data =', typeof res.data);
      if (typeof res.data === 'string') {
        console.log('DEBUG: res.data (first 500 chars):', res.data.slice(0, 500));
      } else if (Array.isArray(res.data)) {
        console.log('DEBUG: res.data[0] =', res.data[0]);
      } else {
        console.log('DEBUG: res.data =', res.data);
      }
    } else {
      // Navigate to the specified path
      items = cfg.itemsPath.split('.').reduce((o, k) => {
        if (!o || !o[k]) {
          console.warn(`Path ${cfg.itemsPath} not found in response`);
          return [];
        }
        return o[k];
      }, res.data);
    }
    
    if (!Array.isArray(items)) {
      console.warn(`Expected array but got: ${typeof items}`);
      return [];
    }
    
    console.log(`Found ${items.length} items`);
    
    return items
      .filter(j => j && j[cfg.titleField] && j[cfg.titleField].toLowerCase().includes(keyword.toLowerCase()))
      .map(j => ({
        title:      j[cfg.titleField] || '',
        url:        j[cfg.urlField] || '',
        datePosted: j[cfg.dateField] || '',
        skills:     j[cfg.skillsField] || []
      }));
  } catch (error) {
    console.error(`Error in fetchXhrApi for ${domain}:`, error.message);
    return [];
  }
}

module.exports = { fetchXhrApi };