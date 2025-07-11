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
  const fullHost = new URL(companyUrl).hostname;
  const strategy = domainMap[fullHost] || domainMap[host] || domainMap['default'];

  console.log(`Using strategy: ${strategy} for ${host} (full host: ${fullHost})`);

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

  // Special case for apple.com: use the Apple jobs search page
  if (companyUrl.includes('apple.com')) {
    companyUrl = 'https://jobs.apple.com/en-in/search?location=bengaluru-BGS';
  }

  // Special case for meta.com: use the Meta jobs search page
  if (companyUrl.includes('meta.com')) {
    companyUrl = 'https://www.metacareers.com/jobs?offices[0]=Bangalore%2C%20India';
  }

  // Special case for nvidia.com: use the NVIDIA jobs search page
  if (companyUrl.includes('nvidia.com')) {
    companyUrl = 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?locationHierarchy1=2fcb99c455831013ea52b82135ba3266&locationHierarchy2=0c3f5f117e9a0101f6422f0fe79d0000';
  }

  // Special case for amazon.com: use the Amazon jobs search page
  if (companyUrl.includes('amazon.com')) {
    companyUrl = 'https://www.amazon.jobs/content/en/locations/india/bangalore';
  }

  // Special case for accenture.com: use the Accenture jobs search page
  if (companyUrl.includes('accenture.com')) {
    companyUrl = 'https://www.accenture.com/in-en/careers/jobsearch?ct=Bengaluru';
  }

  // Special case for capgemini.com: use the Capgemini jobs search page
  if (companyUrl.includes('capgemini.com')) {
    companyUrl = 'https://www.capgemini.com/in-en/careers/join-capgemini/job-search/?country_code=in-en&country_name=India&size=30';
  }

  // Special case for ibm.com: use the IBM jobs search page
  if (companyUrl.includes('ibm.com')) {
    companyUrl = 'https://www.ibm.com/in-en/careers/search?field_keyword_05[0]=India';
  }

  // Special case for oracle.com: use the Oracle jobs search page
  if (companyUrl.includes('oracle.com')) {
    companyUrl = 'https://careers.oracle.com/en/sites/jobsearch/jobs?lastSelectedFacet=AttributeChar13&location=India&locationId=300000000106947&locationLevel=country&mode=location&selectedFlexFieldsFacets="AttributeChar13%7CProfessional%3BCampus"';
  }

  return await dispatch(companyUrl, job);
}

module.exports = { dispatch, scrapeJobs };
