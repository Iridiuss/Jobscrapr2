// src/dispatcher.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { fetchXhrApi } = require('./connectors/atsconnectors');
const { parseJsonLd }  = require('./parsers/jsonLD');
const { parseSitemap } = require('./parsers/sitemap');
const { parseGeneric } = require('./parsers/generic');
const { parsePuppeteer } = require('./parsers/puppeteer');

const domainMap = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'utils/domainMap.json')));

async function dispatch(companyUrl, keyword) {
  const host = new URL(companyUrl).hostname.replace(/^www\./, '');
  const strategy = domainMap[host] || domainMap['default'];

  console.log(`Using strategy: ${strategy} for ${host}`);

  try {
    let result;
    switch (strategy) {
      case 'xhrApi':
        result = await fetchXhrApi(host, keyword);
        break;

      case 'puppeteer':
        result = await parsePuppeteer(companyUrl, keyword);
        break;

      case 'jsonLd': {
        const { data: html } = await axios.get(companyUrl);
        result = await parseJsonLd(html, keyword);
        break;
      }

      case 'sitemap':
        result = await parseSitemap(`${companyUrl}/sitemap.xml`, keyword);
        break;

      default:
        result = await parseGeneric(companyUrl, keyword);
        break;
    }

    // Ensure we always return an array
    if (!Array.isArray(result)) {
      console.warn(`Expected array but got: ${typeof result}`);
      return [];
    }

    return result;
  } catch (error) {
    console.error(`Error in dispatch for ${host}:`, error.message);
    return [];
  }
}

async function scrapeJobs(options) {
  const { company, job } = options;
  
  if (!company || !job) {
    throw new Error('Both company and job parameters are required');
  }

  // Normalize company URL
  let companyUrl = company;
  if (!companyUrl.startsWith('http')) {
    companyUrl = `https://${companyUrl}`;
  }

  // Special case for tcs.com: use the iBegin jobs page
  if (companyUrl.includes('tcs.com')) {
    companyUrl = 'https://ibegin.tcsapps.com/candidate/jobs/search';
  }

  // Special case for deloitte.com: use the Deloitte India jobs page
  if (companyUrl.includes('deloitte.com')) {
    companyUrl = 'https://southasiacareers.deloitte.com/go/Deloitte-India/718244/';
  }

  // Special case for google.com: use the Google Careers jobs results page
  if (companyUrl.includes('google.com')) {
    companyUrl = 'https://www.google.com/about/careers/applications/jobs/results';
  }

  // Special case for infosys.com: use the Infosys jobs page
  if (companyUrl.includes('infosys.com')) {
    companyUrl = 'https://career.infosys.com/jobs?companyhiringtype=IL&countrycode=IN';
  }

  // Special case for microsoft.com: use the Microsoft jobs search page
  if (companyUrl.includes('microsoft.com')) {
    companyUrl = 'https://jobs.careers.microsoft.com/global/en/search?lc=India&l=en_us&pg=1&pgSz=20&o=Relevance&flt=true';
  }

  return await dispatch(companyUrl, job);
}

module.exports = { dispatch, scrapeJobs };
