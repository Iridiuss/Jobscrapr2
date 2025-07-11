const puppeteer = require('puppeteer-core');

// You may need to specify the path to your Chrome/Chromium executable
const CHROME_PATH = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function parsePuppeteer(url, keyword) {
  console.log('[Puppeteer] Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  console.log(`[Puppeteer] Navigating to ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2' });

  let allJobs = [];
  let pageNum = 1;
  const keywordLower = keyword ? keyword.toLowerCase() : '';
  const isInfosys = url.includes('career.infosys.com');
  const isMicrosoft = url.includes('jobs.careers.microsoft.com');
  const isMeta = url.includes('metacareers.com');
  const isNvidia = url.includes('nvidia.wd5.myworkdayjobs.com');
  const isAmazon = url.includes('amazon.jobs');
  const isAccenture = url.includes('accenture.com');
  const isCapgemini = url.includes('capgemini.com');
  const isIbm = url.includes('ibm.com');
  const isOracle = url.includes('oracle.com');
  let lastMatCardCount = null;
  while (pageNum <= 5) {
    console.log(`[Puppeteer] Extracting job listings from page ${pageNum}...`);
    let jobs = [];
    if (isInfosys) {
      await page.waitForSelector('mat-card', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No mat-card found after waiting.');
      });
      const debugInfosys = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('mat-card'));
        return cards.map(card => card.innerText);
      });
      console.log(`[Puppeteer][DEBUG][Infosys] mat-card innerText on page:`, debugInfosys);
      jobs = await page.evaluate((keywordLower, url) => {
        const cards = Array.from(document.querySelectorAll('mat-card'));
        return cards.map(card => {
          const titleElem = card.querySelector('.job-titleTxt');
          const title = titleElem ? titleElem.innerText.trim() : '';
          const locationElem = card.querySelector('.job-locationTxt');
          const location = locationElem ? locationElem.innerText.trim() : '';
          const expElem = card.querySelector('.job-levelTxt');
          const experience = expElem ? expElem.innerText.trim() : '';
          return {
            title,
            url,
            location,
            function: '',
            experience,
            datePosted: '',
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower, url);
      lastMatCardCount = jobs.length;
    } else if (isMicrosoft) {
      await page.waitForSelector('div.ms-DocumentCard', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No ms-DocumentCard found after waiting.');
      });
      const debugMicrosoft = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('div.ms-DocumentCard'));
        return cards.map(card => card.innerText);
      });
      console.log(`[Puppeteer][DEBUG][Microsoft] ms-DocumentCard innerText on page:`, debugMicrosoft);
      jobs = await page.evaluate((keywordLower, url) => {
        const cards = Array.from(document.querySelectorAll('div.ms-DocumentCard'));
        return cards.map(card => {
          // Try to find the job title as the first strong, h3, or direct text
          let title = '';
          const strong = card.querySelector('strong');
          const h3 = card.querySelector('h3');
          if (strong) title = strong.innerText.trim();
          else if (h3) title = h3.innerText.trim();
          else title = card.innerText.split('\n')[0].trim();

          // Extract location and date from the card's innerText
          const text = card.innerText;
          // Location: look for a line with a city, state, country (after title)
          let location = '';
          let datePosted = '';
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          // Try to find a line with a location (e.g., contains 'India' or a city)
          for (let line of lines) {
            if (/\b(India|Bangalore|Hyderabad|Noida|Gurgaon|Chennai|Pune|Delhi|Mumbai|Kolkata|Remote)\b/i.test(line)) {
              location = line;
              break;
            }
          }
          // Date: look for a line with 'Today' or a date
          for (let line of lines) {
            if (/\bToday\b|\d{1,2} \w{3,9} \d{4}/i.test(line)) {
              datePosted = line;
              break;
            }
          }

          return {
            title,
            url,
            location,
            function: '',
            experience: '',
            datePosted,
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower, url);
    } else if (isMeta) {
      await page.waitForSelector('a[href^="/jobs/"]', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Meta job links found after waiting.');
      });
      const debugMeta = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('a[href^="/jobs/"]'));
        return cards.map(card => card.innerText);
      });
      console.log(`[Puppeteer][DEBUG][Meta] job link innerText on page:`, debugMeta);
      jobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll('a[href^="/jobs/"]'));
        return cards.map(card => {
          const title = card.innerText.trim();
          const url = 'https://www.metacareers.com' + card.getAttribute('href');
          return {
            title,
            url,
            location: '',
            function: '',
            experience: '',
            datePosted: '',
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower);
    } else if (isNvidia) {
      await page.waitForSelector('li.css-1q2dra3', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No NVIDIA job cards found after waiting.');
      });
      const debugNvidia = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('li.css-1q2dra3'));
        return cards.map(card => card.innerText);
      });
      console.log(`[Puppeteer][DEBUG][NVIDIA] job card innerText on page:`, debugNvidia);
      jobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll('li.css-1q2dra3'));
        return cards.map(card => {
          const titleElem = card.querySelector('a');
          const title = titleElem ? titleElem.innerText.trim() : '';
          const url = titleElem ? titleElem.href : '';
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          let location = '';
          let datePosted = '';
          let jobId = '';
          for (let line of lines) {
            if (/India|Bangalore|Pune|Hyderabad|Chennai|Noida|Gurgaon|Remote/i.test(line)) location = line;
            if (/Today|Yesterday|\d{1,2} \w{3,9} \d{4}/i.test(line)) datePosted = line;
            if (/^JR\d+$/i.test(line)) jobId = line;
          }
          return {
            title,
            url,
            location,
            function: '',
            experience: '',
            datePosted,
            jobId,
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower);
    } else if (isAmazon) {
      await page.waitForSelector('ul.jobs-module_root__gY8Hp > li', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Amazon job cards found after waiting.');
      });
      const debugAmazon = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('ul.jobs-module_root__gY8Hp > li'));
        return cards.map(card => card.innerText);
      });
      console.log(`[Puppeteer][DEBUG][Amazon] job card innerText on page:`, debugAmazon);
      jobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll('ul.jobs-module_root__gY8Hp > li'));
        return cards.map(card => {
          const titleElem = card.querySelector('a');
          const title = titleElem ? titleElem.innerText.trim() : '';
          const url = titleElem ? titleElem.href : '';
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          let location = '';
          let datePosted = '';
          let description = '';
          for (let line of lines) {
            if (/India|Bangalore|Pune|Hyderabad|Chennai|Noida|Gurgaon|Remote/i.test(line)) location = line;
            if (/Updated|\d{1,2}\/\d{1,2}\/\d{4}/i.test(line)) datePosted = line;
          }
          // Description: the first line after the title and location/date
          if (lines.length > 3) description = lines[3];
          return {
            title,
            url,
            location,
            function: '',
            experience: '',
            datePosted,
            description,
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower);
    } else if (isAccenture) {
      await page.waitForSelector('div.rad-filters-vertical__job-card', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Accenture job cards found after waiting.');
      });
      const debugAccenture = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('div.rad-filters-vertical__job-card'));
        return cards.map(card => card.innerText);
      });
      console.log(`[Puppeteer][DEBUG][Accenture] job card innerText on page:`, debugAccenture);
      jobs = await page.evaluate((keywordLower, url) => {
        const cards = Array.from(document.querySelectorAll('div.rad-filters-vertical__job-card'));
        return cards.map(card => {
          // Title: first line
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          const title = lines[0] || '';
          // Location, Experience, etc. are in the next lines
          let location = '';
          let experience = '';
          let requiredSkill = '';
          for (let line of lines) {
            if (/locations?/i.test(line)) location = line;
            if (/Experience:/i.test(line)) experience = line.replace('Experience:', '').trim();
            if (/Required Skill:/i.test(line)) requiredSkill = line.replace('Required Skill:', '').trim();
          }
          return {
            title,
            url,
            location,
            function: '',
            experience,
            datePosted: '',
            requiredSkill,
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower, url);
    } else if (isCapgemini) {
      await page.waitForSelector('a.table-tr.filter-box.tag-active.joblink', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Capgemini job cards found after waiting.');
      });
      const debugCapgemini = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('a.table-tr.filter-box.tag-active.joblink'));
        return cards.map(card => card.innerText);
      });
      console.log(`[Puppeteer][DEBUG][Capgemini] job card innerText on page:`, debugCapgemini);
      jobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll('a.table-tr.filter-box.tag-active.joblink'));
        return cards.map(card => {
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          const title = lines[0] || '';
          const location = lines[2] || '';
          const experience = (title.match(/\|\s*([\d\-]+\s*years)/i) ? title.match(/\|\s*([\d\-]+\s*years)/i)[1] : '');
          const jobType = lines[3] || '';
          const url = card.href.startsWith('http') ? card.href : ('https://www.capgemini.com' + card.getAttribute('href'));
          return {
            title,
            url,
            location,
            function: jobType,
            experience,
            datePosted: '',
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower);
    } else if (isIbm) {
      // Wait extra for jobs to load (cross-version compatible)
      await new Promise(resolve => setTimeout(resolve, 5000));
      await page.waitForSelector('div.bx--card_wrapper', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No IBM job cards found after waiting.');
      });
      const debugIbmWrappers = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('div.bx--card_wrapper'));
        return cards.map(card => card.innerText);
      });
      console.log(`[Puppeteer][DEBUG][IBM] Found ${debugIbmWrappers.length} card wrappers. InnerText:`, debugIbmWrappers);
      jobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll('div.bx--card_wrapper'));
        return cards.map(card => {
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          const category = lines[0] || '';
          const title = lines[1] || '';
          const level = lines[2] || '';
          const location = lines[3] || '';
          // Try to find a job link in parent or ancestor a
          let url = '';
          let parent = card.parentElement;
          while (parent && parent.tagName !== 'A') parent = parent.parentElement;
          if (parent && parent.tagName === 'A') {
            url = parent.href.startsWith('http') ? parent.href : ('https://www.ibm.com' + parent.getAttribute('href'));
          }
          return {
            title,
            url,
            location,
            function: category,
            experience: level,
            datePosted: '',
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower);
      console.log(`[Puppeteer][DEBUG][IBM] Extracted jobs:`, jobs);
    } else if (isOracle) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await page.waitForSelector("li[data-qa='searchResultItem']", { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Oracle job cards found after waiting.');
      });
      const debugOracle = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll("li[data-qa='searchResultItem']"));
        return cards.map(card => card.innerText);
      });
      console.log(`[Puppeteer][DEBUG][Oracle] Found ${debugOracle.length} job cards. InnerText:`, debugOracle);
      jobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll("li[data-qa='searchResultItem']"));
        return cards.map(card => {
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          const title = lines[0] || '';
          const location = lines[1] || '';
          const description = lines.slice(2).join(' ');
          return {
            title,
            url: '', // Could extract from a child <a> if present
            location,
            function: '',
            experience: '',
            datePosted: '',
            description,
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower);
      console.log(`[Puppeteer][DEBUG][Oracle] Extracted jobs:`, jobs);
    } else {
      jobs = await page.evaluate((keywordLower) => {
        return Array.from(document.querySelectorAll('div.row.custom-row.searched-job, tr.job, tr.data-row, div.job-tile, div.job-listing, li.job, div.job, div.job-list-item')).map(jobDiv => {
          let title = '';
          let url = '';
          let titleLink = jobDiv.querySelector('a');
          if (titleLink) {
            title = titleLink.innerText.trim();
            url = titleLink.href || '';
          } else {
            const titleCell = jobDiv.querySelector('.jobTitle, .job-title, td, span');
            if (titleCell) title = titleCell.innerText.trim();
          }
          const details = jobDiv.innerText.split('\n').map(t => t.trim()).filter(Boolean);
          return {
            title,
            url,
            location: details[1] || '',
            function: details[2] || '',
            experience: details[3] || '',
            datePosted: details[4] || '',
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower);
    }
    console.log(`[Puppeteer] Found ${jobs.length} jobs on page ${pageNum} matching keyword.`);
    allJobs = allJobs.concat(jobs);

    // Pagination for Infosys and Microsoft
    let hasNext = false;
    if (isInfosys) {
      const paginatorHtml = await page.evaluate(() => {
        const paginators = Array.from(document.querySelectorAll('ul.pagination'));
        return paginators.length > 0 ? paginators[0].outerHTML : '';
      });
      console.log(`[Puppeteer][DEBUG][Infosys] Pagination bar HTML:`, paginatorHtml);
      const nextArrowSelector = 'ul.pagination li.pointer:not(.disabled) a';
      const nextArrowExists = await page.$(nextArrowSelector);
      if (nextArrowExists) {
        try {
          await page.click(nextArrowSelector);
          hasNext = true;
        } catch (e) {
          console.log(`[Puppeteer][DEBUG][Infosys] Failed to click next arrow:`, e.message);
          hasNext = false;
        }
      } else {
        hasNext = false;
      }
      if (hasNext) {
        await page.waitForFunction((prevCount) => {
          return document.querySelectorAll('mat-card').length !== prevCount;
        }, { timeout: 15000 }, lastMatCardCount);
      }
      console.log(`[Puppeteer][DEBUG][Infosys] Clicked next arrow for next page: ${hasNext}`);
    } else if (isMicrosoft) {
      // Microsoft: click the next page button if present
      const nextBtnSelector = 'button[data-automation-id="pagination-next"]';
      const nextBtnExists = await page.$(nextBtnSelector);
      if (nextBtnExists) {
        try {
          await page.click(nextBtnSelector);
          hasNext = true;
        } catch (e) {
          console.log(`[Puppeteer][DEBUG][Microsoft] Failed to click next button:`, e.message);
          hasNext = false;
        }
      } else {
        hasNext = false;
      }
      if (hasNext) {
        await page.waitForTimeout ? await page.waitForTimeout(2000) : await new Promise(r => setTimeout(r, 2000));
      }
      console.log(`[Puppeteer][DEBUG][Microsoft] Clicked next button for next page: ${hasNext}`);
    } else {
      hasNext = await page.evaluate(() => {
        const nextBtn = Array.from(document.querySelectorAll('button, a')).find(
          el => el.innerText && el.innerText.trim().toLowerCase() === 'next'
        );
        if (nextBtn && !nextBtn.disabled && !nextBtn.classList.contains('disabled')) {
          nextBtn.click();
          return true;
        }
        return false;
      });
    }
    if (!hasNext) break;
    await page.waitForTimeout ? await page.waitForTimeout(2000) : await new Promise(r => setTimeout(r, 2000));
    pageNum++;
  }

  await browser.close();
  console.log(`[Puppeteer] Browser closed. Total jobs found: ${allJobs.length}`);
  return allJobs;
}

module.exports = { parsePuppeteer }; 