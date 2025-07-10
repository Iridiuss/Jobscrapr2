// src/parsers/jsonLd.js
function extractJsonLd(html) {
    const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    return matches.map(m => JSON.parse(m[1]));
  }
  
  async function parseJsonLd(html, keyword) {
    const scripts = extractJsonLd(html);
    const jobs = [];
    for (const obj of scripts) {
      if (obj['@type'] === 'JobPosting') {
        const title = obj.title || obj.jobTitle;
        if (title && title.toLowerCase().includes(keyword.toLowerCase())) {
          jobs.push({
            title,
            url:        obj.url || obj.applyUrl,
            datePosted: obj.datePosted || obj.postDate,
            skills:     obj.qualifications || obj.skills || []
          });
        }
      }
    }
    return jobs;
  }
  
  module.exports = { parseJsonLd };