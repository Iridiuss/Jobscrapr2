// src/parsers/sitemap.js
const axios = require('axios');
const xml2js = require('xml2js');

async function parseSitemap(url, keyword) {
  const { data: xml } = await axios.get(url);
  const json = await xml2js.parseStringPromise(xml);
  const urls = (json.urlset.url || []).map(u => u.loc[0]);
  return urls
    .filter(u => u.toLowerCase().includes(keyword.toLowerCase()))
    .map(u => ({ title: '', url: u, datePosted: '', skills: [] }));
}

module.exports = { parseSitemap };
