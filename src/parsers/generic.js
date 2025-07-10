// src/parsers/generic.js
const axios = require('axios');
const cheerio = require('cheerio');

async function parseGeneric(url, keyword) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);
  const jobs = [];
  $('h1,h2,h3,a').each((i, el) => {
    const text = $(el).text().trim();
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      const href = $(el).attr('href') || url;
      jobs.push({ title: text, url: href.startsWith('http') ? href : url + href, datePosted: '', skills: [] });
    }
  });
  return jobs;
}

module.exports = { parseGeneric };