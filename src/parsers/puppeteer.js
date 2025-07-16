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
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

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
  const isSap = url.includes('sap.com');
  const isHcl = url.includes('hcltech.com');
  const isWipro = url.includes('wipro.com');
  const isAdobe = url.includes('adobe.com');
  const isGoogle = url.includes('google.com');
  const isApple = url.includes('apple.com');
  const isDeloitte = url.includes('deloitte.com');
  let lastMatCardCount = null;
  while (pageNum <= 5) {
    console.log(`[Puppeteer] Extracting job listings from page ${pageNum}...`);
    console.log(`[Puppeteer][DEBUG] URL: ${url}, isGoogle: ${isGoogle}`);
    let jobs = [];
    if (isInfosys) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
        console.log(`[Puppeteer][Infosys] Processing page ${pageNum}...`);
        
      await page.waitForSelector('mat-card', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No mat-card found after waiting.');
      });
        
        const debugInfosys = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('mat-card'));
          return cards.slice(0, 2).map(card => ({
            innerText: card.innerText,
            links: Array.from(card.querySelectorAll('a')).map(a => ({ href: a.href, text: a.innerText })),
            onclick: card.getAttribute('onclick'),
            dataAttributes: Array.from(card.attributes).filter(attr => attr.name.startsWith('data-'))
          }));
        });
        console.log(`[Puppeteer][DEBUG][Infosys][Page ${pageNum}] mat-card details:`, JSON.stringify(debugInfosys, null, 2));
        
        let jobs = await page.evaluate((url) => {
        const cards = Array.from(document.querySelectorAll('mat-card'));
        return cards.map(card => {
          const titleElem = card.querySelector('.job-titleTxt');
          const title = titleElem ? titleElem.innerText.trim() : '';
          const locationElem = card.querySelector('.job-locationTxt');
          const location = locationElem ? locationElem.innerText.trim() : '';
          const dateElem = card.querySelector('.job-dateTxt, .job-date');
          const datePosted = dateElem ? dateElem.innerText.trim() : '';
            
            // Extract experience from the card text
            let experience = '';
            const cardText = card.innerText;
            const experienceMatch = cardText.match(/Work Experience of (\d+ Years to \d+ Years)/);
            if (experienceMatch) {
              experience = experienceMatch[0];
            }
            
            // Try to extract URL from the card
            let jobUrl = '';
          const link = card.querySelector('a');
          if (link) {
              jobUrl = link.href || '';
              // If the URL is javascript:void(0) or similar, try to find a better URL
              if (jobUrl === 'javascript:void(0);' || jobUrl === '#' || !jobUrl.startsWith('http')) {
                // Try to find any other link in the card
                const allLinks = card.querySelectorAll('a');
                for (const l of allLinks) {
                  if (l.href && l.href.startsWith('http') && !l.href.includes('javascript')) {
                    jobUrl = l.href;
                    break;
                  }
                }
              }
            }
            
            // For Infosys, leave URL empty for now
            if (!jobUrl || jobUrl === 'javascript:void(0);' || jobUrl === '#' || jobUrl === url) {
              jobUrl = '';
            }
            
                      return {
              title,
              location,
              experience
            };
        });
      }, url);
        
        // Filter jobs by keyword
      jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(jobs);
        jobsPerPage.push(jobs.length);
      lastMatCardCount = jobs.length;
        
        console.log(`[Puppeteer][Infosys][Page ${pageNum}] Extracted ${jobs.length} jobs:`);
        jobs.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.title} - ${job.location} - ${job.datePosted}`);
        });
        
        // Navigate to next page if not on the last page
        if (pageNum < 5) {
          try {
            // Look for pagination controls - Infosys uses ul.pagination
            const nextArrowSelector = 'ul.pagination li.pointer:not(.disabled) a';
            const nextArrowExists = await page.$(nextArrowSelector);
            
            if (nextArrowExists) {
              await nextArrowExists.evaluate(b => b.scrollIntoView());
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
                nextArrowExists.click()
              ]);
              await new Promise(resolve => setTimeout(resolve, 3000));
              console.log(`[Puppeteer][Infosys] Clicked next arrow for page ${pageNum + 1}.`);
              
              // Wait for job cards to load on new page
              await page.waitForFunction((prevCount) => {
                return document.querySelectorAll('mat-card').length !== prevCount;
              }, { timeout: 15000 }, lastMatCardCount);
            } else {
              console.log(`[Puppeteer][Infosys] Could not find next arrow on page ${pageNum}.`);
              break;
            }
          } catch (error) {
            console.log(`[Puppeteer][Infosys] Error navigating to next page: ${error.message}`);
            break;
          }
        }
      }
      
      // Remove duplicates based on title and URL
      const uniqueJobs = [];
      const seenJobs = new Set();
      for (const job of allJobs) {
        const jobKey = `${job.title}|${job.url}`;
        if (!seenJobs.has(jobKey)) {
          seenJobs.add(jobKey);
          uniqueJobs.push(job);
        }
      }
      jobs = uniqueJobs;
      
      // Log summary
      console.log(`[Puppeteer][Infosys] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][Infosys] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][Infosys] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isMicrosoft) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
      await page.waitForSelector('div.ms-DocumentCard', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No ms-DocumentCard found after waiting.');
      });
        let jobs = await page.evaluate((url) => {
        const cards = Array.from(document.querySelectorAll('div.ms-DocumentCard'));
        return cards.map(card => {
          let title = '';
          const strong = card.querySelector('strong');
          const h3 = card.querySelector('h3');
          if (strong) title = strong.innerText.trim();
          else if (h3) title = h3.innerText.trim();
          else title = card.innerText.split('\n')[0].trim();
          const text = card.innerText;
          let location = '';
          let datePosted = '';
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            // Find location
          for (let line of lines) {
            if (/\b(India|Bangalore|Hyderabad|Noida|Gurgaon|Chennai|Pune|Delhi|Mumbai|Kolkata|Remote)\b/i.test(line)) {
              location = line;
              break;
            }
          }
            // Find the first date-like line after the title
            let foundTitle = false;
          for (let line of lines) {
              if (!foundTitle && line === title) {
                foundTitle = true;
                continue;
              }
              if (foundTitle && /\bToday\b|\d+\s+day\s+ago|\d{1,2}\s+\w{3,9}\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/i.test(line)) {
              datePosted = line;
              break;
            }
          }
          let url = '';
          // Try to extract URL from the job card by job ID
          const jobItem = card.closest('[aria-label^="Job item"]');
          if (jobItem) {
            const match = jobItem.getAttribute('aria-label').match(/Job item (\d+)/);
            if (match) {
              url = `https://jobs.careers.microsoft.com/global/en/job/${match[1]}`;
            }
          }
          // Debug: log the card structure to understand URL extraction
          console.log(`[Puppeteer][DEBUG][Microsoft] Card structure for "${title}":`, {
            hasJobItem: !!jobItem,
            jobId: jobItem ? jobItem.getAttribute('aria-label') : 'no job item',
            url: url,
            cardHTML: card.outerHTML.substring(0, 200)
          });
          return {
            title,
            location,
            datePosted,
            url
          };
        });
      }, url);
      jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(jobs);
        jobsPerPage.push(jobs.length);
        // Log only the first 3 job titles for this page
        console.log(`[Puppeteer][Microsoft][Page ${pageNum}] First 3 job titles:`, jobs.slice(0, 3).map(j => j.title));
        // Debug: Print pagination controls HTML
        const paginationHtml = await page.evaluate(() => {
          const paginators = Array.from(document.querySelectorAll('nav, ul, li, button, a, div')).filter(el => el.innerText && /\d|>|Next|Previous/i.test(el.innerText));
          return paginators.map(el => el.outerHTML);
        });
        console.log(`[Puppeteer][DEBUG][Microsoft][Page ${pageNum}] Pagination controls outerHTML:`, paginationHtml);
        // Click the Next button if not on the last page
        if (pageNum < 5) {
          const nextBtnSelector = 'button[aria-label="Go to next page"]';
          await page.waitForSelector(nextBtnSelector, { timeout: 10000 });
          const nextBtn = await page.$(nextBtnSelector);
          if (nextBtn) {
            await nextBtn.evaluate(b => b.scrollIntoView());
            const isDisabled = await (await nextBtn.getProperty('disabled')).jsonValue().catch(() => false);
            if (!isDisabled) {
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
                nextBtn.click()
              ]);
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log(`[Puppeteer][Microsoft] Clicked Next button for page ${pageNum + 1}.`);
            } else {
              console.log(`[Puppeteer][Microsoft] Next button is disabled on page ${pageNum}.`);
              break;
            }
          } else {
            console.log(`[Puppeteer][Microsoft] Could not find Next button on page ${pageNum}.`);
            break;
          }
        }
      }
      jobs = allJobs;
      // Log summary
      console.log(`[Puppeteer][Microsoft] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][Microsoft] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][Microsoft] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isMeta) {
      let allJobs = [];
      let jobsPerPage = [];
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
        if (pageNum > 1) {
          // Click the page number link for the next page
          const pageLinkSelector = `a[href*='page=${pageNum}']`;
          const pageLink = await page.$(pageLinkSelector);
          if (!pageLink) {
            console.log(`[Puppeteer][Meta] No page link for page ${pageNum} (likely last page). Stopping pagination.`);
            break;
          }
          await pageLink.evaluate(b => b.scrollIntoView());
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
            pageLink.click()
          ]);
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log(`[Puppeteer][Meta] Clicked page ${pageNum} link.`);
        }
      await page.waitForSelector('a[href^="/jobs/"]', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Meta job links found after waiting.');
      });
      const debugMeta = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('a[href^="/jobs/"]'));
        return cards.map(card => card.innerText);
      });
        console.log(`[Puppeteer][DEBUG][Meta][Page ${pageNum}] job link innerText on page:`, debugMeta.slice(0, 3));
        let jobs = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('a[href^="/jobs/"]'));
        return cards.map(card => {
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          const title = lines[0] || '';
          // Try to find a line that looks like a location (e.g., "Bangalore, India")
          let location = '';
          for (let i = 1; i < lines.length; i++) {
            if (/^[A-Za-z ]+, [A-Za-z ]+$/.test(lines[i])) {
              location = lines[i];
              break;
            }
          }
          const url = 'https://www.metacareers.com' + card.getAttribute('href');
          return {
            title,
            location,
            datePosted: '',
            url
          };
        });
      });
      jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(jobs);
        jobsPerPage.push(jobs.length);
        // Log only the first 3 job titles for this page
        console.log(`[Puppeteer][Meta][Page ${pageNum}] First 3 job titles:`, jobs.slice(0, 3).map(j => j.title));
      }
      jobs = allJobs;
      // Log summary
      console.log(`[Puppeteer][Meta] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][Meta] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][Meta] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isNvidia) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
      await page.waitForSelector('li.css-1q2dra3', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No NVIDIA job cards found after waiting.');
      });
        let jobs = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('li.css-1q2dra3'));
        return cards.map(card => {
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          let title = lines[0] || '';
          let location = '';
          let datePosted = '';
          let url = '';
          const titleElem = card.querySelector('a');
          if (titleElem) url = titleElem.href || '';
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase() === 'locations' && i + 1 < lines.length) {
              location = lines[i + 1];
            }
            if (lines[i].toLowerCase() === 'posted on' && i + 1 < lines.length) {
              datePosted = lines[i + 1];
            }
          }
          // Post-process datePosted
          if (/Posted Today/i.test(datePosted)) {
            const today = new Date();
            datePosted = today.toISOString().slice(0, 10);
          } else if (/\d{2}\/\d{2}\/\d{4}/.test(datePosted)) {
            const m = datePosted.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (m) datePosted = `${m[3]}-${m[1]}-${m[2]}`;
          }
          return {
            title,
            location,
            datePosted,
            url
          };
        });
      });
      jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(jobs);
        jobsPerPage.push(jobs.length);
        // Log only the first 3 job titles for this page
        console.log(`[Puppeteer][NVIDIA][Page ${pageNum}] First 3 job titles:`, jobs.slice(0, 3).map(j => j.title));
        // Click the next page number if not on the last page
        if (pageNum < 5) {
          const nextPageNum = pageNum + 1;
          const pageBtnSelector = `button[aria-label='page ${nextPageNum}']`;
          await page.waitForSelector(pageBtnSelector, { timeout: 10000 });
          const pageBtns = await page.$$(pageBtnSelector);
          let clicked = false;
          for (const btn of pageBtns) {
            await btn.evaluate(b => b.scrollIntoView());
            const isDisabled = await (await btn.getProperty('disabled')).jsonValue().catch(() => false);
            if (!isDisabled) {
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
                btn.click()
              ]);
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log(`[Puppeteer][NVIDIA] Clicked page ${nextPageNum} button.`);
              clicked = true;
              break;
            }
          }
          if (!clicked) {
            console.log(`[Puppeteer][NVIDIA] Could not find page button for page ${nextPageNum}`);
            break;
          }
        }
      }
      jobs = allJobs;
      // Log summary
      console.log(`[Puppeteer][NVIDIA] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][NVIDIA] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][NVIDIA] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isAmazon) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
      await page.waitForSelector('ul.jobs-module_root__gY8Hp > li', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Amazon job cards found after waiting.');
      });
      const debugAmazon = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('ul.jobs-module_root__gY8Hp > li'));
        return cards.map(card => card.innerText);
      });
        console.log(`[Puppeteer][DEBUG][Amazon][Page ${pageNum}] Found ${debugAmazon.length} job cards. InnerText:`, debugAmazon);
        let jobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll('ul.jobs-module_root__gY8Hp > li'));
        return cards.map(card => {
          const titleElem = card.querySelector('a');
          const title = titleElem ? titleElem.innerText.trim() : '';
          const url = titleElem ? titleElem.href : '';
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          let location = '';
          let datePosted = '';
          let description = '';
            
            // Extract location from the second line (after title)
            if (lines.length > 1) {
              const locationLine = lines[1];
              // Check if this line looks like a location (contains city, state, country)
              if (/^[A-Za-z\s]+, [A-Z]{2}, [A-Z]{3}$/.test(locationLine) || 
                  /^[A-Za-z\s]+, [A-Za-z\s]+$/.test(locationLine)) {
                location = locationLine;
              }
            }
            
            // Extract date posted
          for (let line of lines) {
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
        
        jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(jobs);
        jobsPerPage.push(jobs.length);
        // Log all job titles for this page
        console.log(`[Puppeteer][Amazon][Page ${pageNum}] Found ${jobs.length} jobs:`);
        jobs.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.title} - ${job.location} - ${job.datePosted}`);
        });
        
        // Click the next page button if not on the last page
        if (pageNum < 5) {
          const nextBtnSelector = 'button[data-test-id="next-page"]';
          await page.waitForSelector(nextBtnSelector, { timeout: 10000 });
          const nextBtn = await page.$(nextBtnSelector);
          if (nextBtn) {
            await nextBtn.evaluate(b => b.scrollIntoView());
            const isDisabled = await (await nextBtn.getProperty('disabled')).jsonValue().catch(() => false);
            if (!isDisabled) {
              await nextBtn.click();
              await new Promise(resolve => setTimeout(resolve, 3000));
              console.log(`[Puppeteer][Amazon] Clicked Next button for page ${pageNum + 1}.`);
            } else {
              console.log(`[Puppeteer][Amazon] Next button is disabled on page ${pageNum}.`);
              break;
            }
          } else {
            console.log(`[Puppeteer][Amazon] Could not find Next button on page ${pageNum}.`);
            break;
          }
        }
      }
      jobs = allJobs;
      // Log summary
      console.log(`[Puppeteer][Amazon] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][Amazon] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][Amazon] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isAccenture) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      let previousJobTitles = [];
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
      await page.waitForSelector('div.rad-filters-vertical__job-card', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Accenture job cards found after waiting.');
      });
      const debugAccenture = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('div.rad-filters-vertical__job-card'));
        return cards.map(card => card.innerText);
      });
        console.log(`[Puppeteer][DEBUG][Accenture][Page ${pageNum}] job card innerText on page:`, debugAccenture);
        let jobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll('div.rad-filters-vertical__job-card'));
        return cards.map(card => {
          // Title: first line
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          const title = lines[0] || '';
          // Improved location extraction
          let location = '';
          let experience = '';
          let requiredSkill = '';
          // Find location as the first non-keyword line after the title
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (/^Expand job details$/i.test(line) || /Full time|Part time/i.test(line) || /Experience:/i.test(line) || /Required Skill:/i.test(line)) {
              continue;
            }
            if (!location) {
              location = line;
              break;
            }
          }
          // Extract experience and requiredSkill as before
          for (let line of lines) {
            if (/Experience:/i.test(line)) experience = line.replace('Experience:', '').trim();
            if (/Required Skill:/i.test(line)) requiredSkill = line.replace('Required Skill:', '').trim();
          }
            
            // Extract job URL from the card
            let url = '';
            const link = card.querySelector('a');
            if (link) {
              url = link.href || '';
              // Ensure the URL is absolute
              if (url && !url.startsWith('http')) {
                url = 'https://www.accenture.com' + url;
              }
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
        }, keywordLower);
        
        jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        // Duplicate detection: break if job titles are the same as previous page
        const currentJobTitles = jobs.map(j => j.title).join('|');
        if (previousJobTitles.length > 0 && currentJobTitles === previousJobTitles.join('|')) {
          console.log(`[Puppeteer][Accenture][Page ${pageNum}] Detected duplicate job titles, stopping pagination.`);
          break;
        }
        previousJobTitles = jobs.map(j => j.title);
        allJobs = allJobs.concat(jobs);
        jobsPerPage.push(jobs.length);
        // Log all job titles for this page
        console.log(`[Puppeteer][Accenture][Page ${pageNum}] Found ${jobs.length} jobs:`);
        jobs.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.title} - ${job.location} - ${job.experience}`);
        });
        
        // Click the next page button if not on the last page
        if (pageNum < 5) {
          const nextBtnSelector = 'button[aria-label="Next"]';
          
          // Debug: Check pagination controls
          const paginationDebug = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.map(btn => ({
              text: btn.innerText,
              ariaLabel: btn.getAttribute('aria-label'),
              disabled: btn.disabled,
              className: btn.className
            }));
          });
          console.log(`[Puppeteer][DEBUG][Accenture][Page ${pageNum}] All buttons:`, paginationDebug);
          
          await page.waitForSelector(nextBtnSelector, { timeout: 10000 });
          const nextBtn = await page.$(nextBtnSelector);
          if (nextBtn) {
            await nextBtn.evaluate(b => b.scrollIntoView());
            const isDisabled = await (await nextBtn.getProperty('disabled')).jsonValue().catch(() => false);
            console.log(`[Puppeteer][DEBUG][Accenture][Page ${pageNum}] Next button disabled:`, isDisabled);
            if (!isDisabled) {
              await nextBtn.click();
              await new Promise(resolve => setTimeout(resolve, 3000));
              console.log(`[Puppeteer][Accenture] Clicked Next button for page ${pageNum + 1}.`);
            } else {
              console.log(`[Puppeteer][Accenture] Next button is disabled on page ${pageNum}.`);
              break;
            }
          } else {
            console.log(`[Puppeteer][Accenture] Could not find Next button on page ${pageNum}.`);
            break;
          }
        }
      }
      jobs = allJobs;
      // Log summary
      console.log(`[Puppeteer][Accenture] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][Accenture] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][Accenture] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isCapgemini) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      let previousJobCount = 0;
      
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
      await page.waitForSelector('a.table-tr.filter-box.tag-active.joblink', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Capgemini job cards found after waiting.');
      });
        
        // For page 1, extract initial jobs
        if (pageNum === 1) {
          let currentJobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll('a.table-tr.filter-box.tag-active.joblink'));
            console.log(`[Puppeteer][DEBUG][Capgemini] Found ${cards.length} job cards in DOM`);
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
          
          allJobs = allJobs.concat(currentJobs);
          jobsPerPage.push(currentJobs.length);
          previousJobCount = currentJobs.length;
          
          console.log(`[Puppeteer][Capgemini][Page ${pageNum}] Found ${currentJobs.length} initial jobs:`);
          currentJobs.forEach((job, index) => {
            console.log(`  ${index + 1}. ${job.title} - ${job.location} - ${job.experience}`);
          });
        }
        
        // Click "Load More" button if not on the last page
        if (pageNum < 5) {
          const loadMoreSelector = 'a[aria-label="Load More about jobs"]';
          try {
            await page.waitForSelector(loadMoreSelector, { timeout: 10000 });
            const loadMoreBtn = await page.$(loadMoreSelector);
            if (loadMoreBtn) {
              await loadMoreBtn.evaluate(b => b.scrollIntoView());
              await loadMoreBtn.click();
              console.log(`[Puppeteer][Capgemini] Clicked Load More button for page ${pageNum + 1}.`);
              
              // Wait for new jobs to load with longer timeout
              await new Promise(resolve => setTimeout(resolve, 5000));
              
              // Wait for job count to increase with retry mechanism
              let attempts = 0;
              let newJobCount = previousJobCount;
              while (attempts < 15) {
                newJobCount = await page.evaluate(() => {
                  return document.querySelectorAll('a.table-tr.filter-box.tag-active.joblink').length;
                });
                console.log(`[Puppeteer][DEBUG][Capgemini] Attempt ${attempts + 1}: job count = ${newJobCount} (previous = ${previousJobCount})`);
                if (newJobCount > previousJobCount) {
                  console.log(`[Puppeteer][Capgemini] New jobs loaded: ${previousJobCount} -> ${newJobCount}`);
                  // Wait a bit more for DOM to fully update
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
              }
              
              if (newJobCount <= previousJobCount) {
                console.log(`[Puppeteer][Capgemini] Warning: Job count did not increase after Load More. Expected > ${previousJobCount}, got ${newJobCount}`);
              }
              
              // Extract new jobs after Load More (for pages 2-5)
              if (pageNum >= 2) {
                let currentJobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll('a.table-tr.filter-box.tag-active.joblink'));
                  console.log(`[Puppeteer][DEBUG][Capgemini] Found ${cards.length} job cards in DOM after Load More`);
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
                
                // Get only new jobs (jobs that weren't there before)
                let newJobs = currentJobs.slice(previousJobCount);
                
                console.log(`[Puppeteer][DEBUG][Capgemini][Page ${pageNum}] Job counting: previous=${previousJobCount}, current=${currentJobs.length}, new=${newJobs.length}`);
                
                previousJobCount = currentJobs.length;
                allJobs = allJobs.concat(newJobs);
                jobsPerPage.push(newJobs.length);
                
                console.log(`[Puppeteer][Capgemini][Page ${pageNum}] Found ${newJobs.length} new jobs:`);
                newJobs.forEach((job, index) => {
                  console.log(`  ${index + 1}. ${job.title} - ${job.location} - ${job.experience}`);
                });
              }
            } else {
              console.log(`[Puppeteer][Capgemini] Could not find Load More button on page ${pageNum}.`);
              break;
            }
          } catch (error) {
            console.log(`[Puppeteer][Capgemini] Error with Load More: ${error.message}`);
            console.log(`[Puppeteer][Capgemini] Stopping pagination due to Load More issues.`);
            break;
          }
        }
      }
      jobs = allJobs;
      // Log summary
      console.log(`[Puppeteer][Capgemini] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][Capgemini] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][Capgemini] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isIbm) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
        // Wait for any job-related content to load
        await page.waitForSelector('[data-auto-id="dds--card-group"], div.bx--card-group__car_ds_col, div[role="region"], .job-card, .career-card', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No IBM job cards found after waiting.');
      });
        
        // Debug: Check what elements are actually on the page
        const debugPageStructure = await page.evaluate(() => {
          const allDivs = Array.from(document.querySelectorAll('div'));
          const cardLikeDivs = allDivs.filter(div => 
            div.className && (
              div.className.includes('card') || 
              div.className.includes('job') || 
              div.className.includes('career') ||
              div.getAttribute('role') === 'region'
            )
          );
          return {
            totalDivs: allDivs.length,
            cardLikeDivs: cardLikeDivs.map(div => ({
              className: div.className,
              role: div.getAttribute('role'),
              ariaLabel: div.getAttribute('aria-label'),
              innerText: div.innerText.substring(0, 100)
            }))
          };
        });
        console.log(`[Puppeteer][DEBUG][IBM][Page ${pageNum}] Page structure:`, debugPageStructure);
        
        const debugIbmCards = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('div.bx--card-group__car_ds_col, [data-auto-id="dds--card-group"] div, div[role="region"]'));
          return cards.map(card => ({
            innerText: card.innerText,
            ariaLabel: card.getAttribute('aria-label'),
            hasLink: !!card.querySelector('a'),
            className: card.className
          }));
        });
        console.log(`[Puppeteer][DEBUG][IBM][Page ${pageNum}] Found ${debugIbmCards.length} job cards. Details:`, debugIbmCards);
        let jobs = await page.evaluate((keywordLower) => {
          const cards = Array.from(document.querySelectorAll('div.bx--card-group__car_ds_col, [data-auto-id="dds--card-group"] div, div[role="region"]'));
        return cards.map(card => {
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          const category = lines[0] || '';
          const title = lines[1] || '';
          const level = lines[2] || '';
          const location = lines[3] || '';
            
            // Try to find a job link
          let url = '';
            const link = card.querySelector('a');
            if (link) {
              url = link.href || '';
              if (!url.startsWith('http')) {
                url = 'https://www.ibm.com' + url;
              }
            }
            
            // Only return jobs that have meaningful content
            if (!title || title.length < 5) {
              return null;
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
          }).filter(job => job && (keywordLower === '' || (job.title && job.title.toLowerCase().includes(keywordLower))));
      }, keywordLower);
        
        jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(jobs);
        jobsPerPage.push(jobs.length);
        // Log all job titles for this page
        console.log(`[Puppeteer][IBM][Page ${pageNum}] Found ${jobs.length} jobs:`);
        jobs.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.title} - ${job.location} - ${job.experience}`);
        });
        
        // Click the next page button if not on the last page
        if (pageNum < 5) {
          const nextBtnSelector = 'button[aria-label="Next page"], button[aria-label="Next"], a[aria-label="Next page"], a[aria-label="Next"]';
          try {
            await page.waitForSelector(nextBtnSelector, { timeout: 10000 });
            const nextBtn = await page.$(nextBtnSelector);
            if (nextBtn) {
              await nextBtn.evaluate(b => b.scrollIntoView());
              const isDisabled = await (await nextBtn.getProperty('disabled')).jsonValue().catch(() => false);
              if (!isDisabled) {
                await nextBtn.click();
                await new Promise(resolve => setTimeout(resolve, 3000));
                console.log(`[Puppeteer][IBM] Clicked Next button for page ${pageNum + 1}.`);
              } else {
                console.log(`[Puppeteer][IBM] Next button is disabled on page ${pageNum}.`);
                break;
              }
            } else {
              console.log(`[Puppeteer][IBM] Could not find Next button on page ${pageNum}.`);
              break;
            }
          } catch (error) {
            console.log(`[Puppeteer][IBM] Error with pagination: ${error.message}`);
            console.log(`[Puppeteer][IBM] Stopping pagination due to pagination issues.`);
            break;
          }
        }
      }
      jobs = allJobs;
      // Log summary
      console.log(`[Puppeteer][IBM] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][IBM] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][IBM] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isOracle) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await page.waitForSelector("li[data-qa='searchResultItem']", { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Oracle job cards found after waiting.');
      });
      
      // Debug: Check what's actually on the page
      const debugOracle = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll("li[data-qa='searchResultItem']"));
        return cards.map(card => ({
          innerText: card.innerText,
          hasLink: !!card.querySelector('a'),
          linkHref: card.querySelector('a')?.href || '',
          className: card.className
        }));
      });
      console.log(`[Puppeteer][DEBUG][Oracle] Found ${debugOracle.length} job cards. Details:`, debugOracle);
      
      jobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll("li[data-qa='searchResultItem']"));
        console.log(`[Puppeteer][DEBUG][Oracle] Processing ${cards.length} job cards`);
        
        return cards.map(card => {
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          let title = lines[0] || '';
          let location = '';
          let description = '';
          let datePosted = '';
          let url = '';
          
          // Extract URL from the job card
          const link = card.querySelector('a');
          if (link) {
            url = link.href || '';
            if (!url.startsWith('http')) {
              url = 'https://careers.oracle.com' + url;
            }
          }
          
          // Extract location (usually appears after title)
            for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            // Look for location patterns like "India and 1 more" or "India" or city names
            if (!location && (
              line.includes('India') || 
              line.includes('BENGALURU') || 
              line.includes('HYDERABAD') || 
              line.includes('PUNE') || 
              line.includes('GURUGRAM') ||
              /^[A-Za-z\s]+(?: and \d+ more)?$/.test(line) ||
              /^[A-Z\s]+, [A-Z\s]+, India$/.test(line)
            )) {
              location = line;
              continue;
            }
            // Look for description (longer text after location, skip TRENDING and other short tags)
            if (!description && line.length > 30 && !line.includes('TRENDING') && !line.includes('BE THE FIRST TO APPLY') && !line.includes('Posted')) {
              description = line;
                break;
              }
            }
          
          // Look for date patterns in the entire card text
          const cardText = card.innerText;
          const datePatterns = [
            /\d{2}\/\d{2}\/\d{4}/,
            /\d{4}-\d{2}-\d{2}/,
            /\d{1,2}\s+\w{3,9}\s+\d{4}/
          ];
          
          for (const pattern of datePatterns) {
            const match = cardText.match(pattern);
            if (match) {
              datePosted = match[0];
              break;
            }
          }
          
          // Convert MM/DD/YYYY to YYYY-MM-DD if needed
          if (/\d{2}\/\d{2}\/\d{4}/.test(datePosted)) {
            const m = datePosted.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (m) datePosted = `${m[3]}-${m[1]}-${m[2]}`;
          }
          
          const job = {
            title,
            location,
            description,
            datePosted,
            url,
            function: '',
            experience: '',
            skills: []
          };
          
          console.log(`[Puppeteer][DEBUG][Oracle] Extracted job: ${title} - ${location}`);
          return job;
        }).filter(job => job.title && job.title.length > 5); // Filter out empty or invalid jobs
      }, keywordLower);
      
      // Filter by keyword after extraction
      jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      
      console.log(`[Puppeteer][Oracle] Extracted ${jobs.length} jobs from page 1:`);
      jobs.forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.title} - ${job.location} - ${job.description?.substring(0, 50)}...`);
      });
    } else if (isSap) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
        console.log(`[Puppeteer][SAP] Processing page ${pageNum}...`);
        
        // Wait for job cards to load
      await page.waitForSelector('tr.data-row', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No SAP job cards found after waiting.');
      });
        
        // Get all job cards on current page
        const jobCards = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('tr.data-row'));
          return cards.map((card, index) => {
            const titleLink = card.querySelector('a');
            const title = titleLink ? titleLink.innerText.trim() : (card.innerText.split('\n')[0] || '');
            const location = card.innerText.split('\n')[1] || '';
          return {
              index,
            title,
            location,
              hasLink: !!titleLink,
              linkHref: titleLink ? titleLink.href : ''
            };
          });
        });
        
        console.log(`[Puppeteer][SAP][Page ${pageNum}] Found ${jobCards.length} job cards.`);
        
        let pageJobs = [];
        // Process each job on the current page
        for (let i = 0; i < jobCards.length; i++) {
          const jobCard = jobCards[i];
          if (keywordLower !== '' && !jobCard.title.toLowerCase().includes(keywordLower)) {
            continue;
          }
          
          try {
            console.log(`[Puppeteer][SAP][Page ${pageNum}] Processing job ${i + 1}/${jobCards.length}: ${jobCard.title}`);
            
            // Wait for job cards to be available again after navigation
            await page.waitForSelector('tr.data-row', { timeout: 10000 });
            const cards = await page.$$('tr.data-row');
            const titleLink = await cards[i].$('a');
            
                          if (titleLink) {
                try {
                  // Get the href before clicking
                  const jobUrl = await titleLink.evaluate(link => link.href);
                  console.log(`[Puppeteer][SAP][Page ${pageNum}] Job URL: ${jobUrl}`);
                  
                  // Use goto instead of click
                  await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                  await new Promise(resolve => setTimeout(resolve, 3000)); // extra wait for slow pages

                  // Extract canonical URL, date posted, and skills
                  const jobDetails = await page.evaluate(() => {
                    let url = '';
                    const canonical = document.querySelector('link[rel="canonical"]');
                    url = canonical?.href || window.location.href;
                    
                    // Try to find date posted - SAP specific selectors
                    let datePosted = '';
                    const sapDateSelectors = [
                      '[data-qa="job-posted-date"]',
                      '[class*="posted"]',
                      '[class*="date"]',
                      'span[class*="date"]',
                      'div[class*="date"]',
                      'p[class*="date"]',
                      '.job-posted-date',
                      '.posted-date',
                      'span',
                      'div',
                      'p'
                    ];
                    
                    const datePatterns = [
                      /\bPosted\b.*\d{1,2}\/\d{1,2}\/\d{4}/i,
                      /\bPosted\b.*\d{4}-\d{2}-\d{2}/i,
                      /\bCreated\b.*\d{1,2}\/\d{1,2}\/\d{4}/i,
                      /\bCreated\b.*\d{4}-\d{2}-\d{2}/i,
                      /\bPublished\b.*\d{1,2}\/\d{1,2}\/\d{4}/i,
                      /\bPublished\b.*\d{4}-\d{2}-\d{2}/i,
                      /\d{1,2}\/\d{1,2}\/\d{4}/,
                      /\d{4}-\d{2}-\d{2}/,
                      /\d{1,2}\s+\w{3,9}\s+\d{4}/i
                    ];
                    
                    // Try SAP-specific date extraction first
                    for (const selector of sapDateSelectors) {
                      const elements = document.querySelectorAll(selector);
                      for (const element of elements) {
                        const text = element.innerText.trim();
                        for (const pattern of datePatterns) {
                          if (pattern.test(text)) {
                            datePosted = text;
                            break;
                          }
                        }
                        if (datePosted) break;
                      }
                      if (datePosted) break;
                    }
                    
                    // Extract skills from the job description
                    let skills = [];
                    const skillSelectors = [
                      '[data-qa="job-description"]',
                      '.job-description',
                      '[class*="description"]',
                      'div[class*="content"]',
                      'p',
                      'div'
                    ];
                    
                    for (const selector of skillSelectors) {
                      const elements = document.querySelectorAll(selector);
                      for (const element of elements) {
                        const text = element.innerText.toLowerCase();
                        // Look for common skill keywords
                        const skillKeywords = [
                          'java', 'python', 'javascript', 'react', 'angular', 'node.js', 'sql', 'oracle', 'sap',
                          'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'agile', 'scrum', 'devops',
                          'machine learning', 'ai', 'data science', 'analytics', 'business intelligence',
                          'salesforce', 'microsoft', 'aws', 'gcp', 'microservices', 'api', 'rest'
                        ];
                        
                        for (const keyword of skillKeywords) {
                          if (text.includes(keyword)) {
                            skills.push(keyword);
                          }
                        }
                      }
                      if (skills.length > 0) break;
                    }
                    
                    // Remove duplicates and limit to top 10 skills
                    skills = [...new Set(skills)].slice(0, 10);
                    
                    return { url, datePosted, skills };
                  });

                pageJobs.push({
                  title: jobCard.title,
                  location: jobCard.location,
                  url: jobDetails.url,
                  datePosted: jobDetails.datePosted,
            function: '',
            experience: '',
                  skills: jobDetails.skills || []
                });

                                  // Better return navigation - go back to the original listing URL
                  const originalUrl = url; // Use the original URL passed to the function
                  await page.goto(originalUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait longer for page to load
                  
                  // Wait for job cards to be available again with retry mechanism
                  let retries = 0;
                  while (retries < 5) {
                    try {
                      await page.waitForSelector('tr.data-row', { timeout: 10000 });
                      console.log(`[Puppeteer][SAP][Page ${pageNum}] Successfully returned to listing page after ${retries + 1} attempts`);
                      break;
                    } catch (waitError) {
                      retries++;
                      console.log(`[Puppeteer][SAP][Page ${pageNum}] Retry ${retries}/5: Job cards not found, waiting...`);
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      if (retries >= 5) {
                        console.log(`[Puppeteer][SAP][Page ${pageNum}] Failed to return to listing page after ${retries} attempts`);
                        break;
                      }
                    }
                  }
              } catch (navigationError) {
                console.log(`[Puppeteer][SAP][Page ${pageNum}] Navigation timeout for job ${i + 1}, using fallback data.`);
                pageJobs.push({
                  title: jobCard.title,
                  location: jobCard.location,
                  url: jobCard.linkHref || '',
            datePosted: '',
                  function: '',
                  experience: '',
            skills: []
                });
              }
            } else {
              // No link found, fallback
              pageJobs.push({
                title: jobCard.title,
                location: jobCard.location,
                url: jobCard.linkHref || '',
                datePosted: '',
                function: '',
                experience: '',
                skills: []
              });
            }
          } catch (error) {
            console.log(`[Puppeteer][SAP][Page ${pageNum}] Error processing job ${i + 1}: ${error.message}`);
            pageJobs.push({
              title: jobCard.title,
              location: jobCard.location,
              url: jobCard.linkHref || '',
              datePosted: '',
              function: '',
              experience: '',
              skills: []
            });
          }
        }
        
        // Filter jobs by keyword
        pageJobs = pageJobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(pageJobs);
        jobsPerPage.push(pageJobs.length);
        
        console.log(`[Puppeteer][SAP][Page ${pageNum}] Extracted ${pageJobs.length} jobs:`);
        pageJobs.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.title} - ${job.location} - ${job.datePosted}`);
        });
        
        // Navigate to next page if not on the last page
        if (pageNum < 5) {
          try {
            // Look for pagination controls - try different selectors based on the screenshot
            const paginationSelectors = [
              'a[title="Next Page"]',
              'a[title="Last Page"]',
              'a.paginationItemLast',
              'a[href*="page="]',
              'a[href*="150"]', // Based on the URL pattern in screenshot
              'ul.pagination a:last-child'
            ];
            
            let nextPageLink = null;
            for (const selector of paginationSelectors) {
              nextPageLink = await page.$(selector);
              if (nextPageLink) {
                console.log(`[Puppeteer][SAP] Found pagination link with selector: ${selector}`);
                break;
              }
            }
            
            if (nextPageLink) {
              await nextPageLink.evaluate(b => b.scrollIntoView());
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
                nextPageLink.click()
              ]);
              await new Promise(resolve => setTimeout(resolve, 3000));
              console.log(`[Puppeteer][SAP] Navigated to page ${pageNum + 1}.`);
            } else {
              console.log(`[Puppeteer][SAP] Could not find next page link on page ${pageNum}.`);
              break;
            }
          } catch (error) {
            console.log(`[Puppeteer][SAP] Error navigating to next page: ${error.message}`);
            break;
          }
        }
      }
      
      // Remove duplicates based on title and URL
      const uniqueJobs = [];
      const seenJobs = new Set();
      for (const job of allJobs) {
        const jobKey = `${job.title}|${job.url}`;
        if (!seenJobs.has(jobKey)) {
          seenJobs.add(jobKey);
          uniqueJobs.push(job);
        }
      }
      jobs = uniqueJobs;
      
      // Log summary
      console.log(`[Puppeteer][SAP] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][SAP] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][SAP] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isHcl) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
        console.log(`[Puppeteer][HCL] Processing page ${pageNum}...`);
        
      await page.waitForSelector('table tbody tr', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No HCLTech job cards found after waiting.');
      });
        
      const debugHcl = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('table tbody tr'));
        return cards.map(card => card.innerText);
      });
        console.log(`[Puppeteer][DEBUG][HCLTech][Page ${pageNum}] Found ${debugHcl.length} job cards. InnerText:`, debugHcl);
        
        let jobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll('table tbody tr'));
        return cards.map(card => {
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          const title = lines[0] || '';
          const date = lines[1] || '';
          const location = lines[2] || '';
          let url = '';
          const viewJobBtn = card.querySelector('a,button');
          if (viewJobBtn) {
            url = viewJobBtn.href || '';
          }
          return {
            title,
            url,
            location,
            function: '',
            experience: '',
            datePosted: date,
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower);
        
        // Filter jobs by keyword
        jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(jobs);
        jobsPerPage.push(jobs.length);
        
        console.log(`[Puppeteer][HCL][Page ${pageNum}] Extracted ${jobs.length} jobs:`);
        jobs.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.title} - ${job.location} - ${job.datePosted}`);
        });
        
        // Navigate to next page if not on the last page
        if (pageNum < 5) {
          try {
            // Look for pagination controls - HCL might use different selectors
            const paginationSelectors = [
              'a[href*="page="]',
              'a[href*="p="]',
              'ul.pagination a',
              'div.pagination a',
              'a[class*="next"]',
              'a[class*="page"]'
            ];
            
            let nextPageLink = null;
            for (const selector of paginationSelectors) {
              const links = await page.$$(selector);
              for (const link of links) {
                const text = await (await link.getProperty('innerText')).jsonValue();
                if (text.trim() === String(pageNum + 1) || text.trim().toLowerCase().includes('next')) {
                  nextPageLink = link;
                  break;
                }
              }
              if (nextPageLink) break;
            }
            
            if (nextPageLink) {
              await nextPageLink.evaluate(b => b.scrollIntoView());
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
                nextPageLink.click()
              ]);
              await new Promise(resolve => setTimeout(resolve, 3000));
              console.log(`[Puppeteer][HCL] Navigated to page ${pageNum + 1}.`);
            } else {
              console.log(`[Puppeteer][HCL] Could not find next page link on page ${pageNum}.`);
              break;
            }
          } catch (error) {
            console.log(`[Puppeteer][HCL] Error navigating to next page: ${error.message}`);
            break;
          }
        }
      }
      
      // Remove duplicates based on title and URL
      const uniqueJobs = [];
      const seenJobs = new Set();
      for (const job of allJobs) {
        const jobKey = `${job.title}|${job.url}`;
        if (!seenJobs.has(jobKey)) {
          seenJobs.add(jobKey);
          uniqueJobs.push(job);
        }
      }
      jobs = uniqueJobs;
      
      // Log summary
      console.log(`[Puppeteer][HCL] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][HCL] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][HCL] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isWipro) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
      await page.waitForSelector('tr.data-row', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Wipro job cards found after waiting.');
      });
      // Log the outerHTML of the first 3 tr.data-row elements
      const debugWiproHtml = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('tr.data-row')).slice(0, 3).map(row => row.outerHTML);
      });
        console.log(`[Puppeteer][DEBUG][Wipro][Page ${pageNum}] First 3 tr.data-row outerHTML:`, debugWiproHtml);
        let jobs = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('tr.data-row'));
        return cards.map(card => {
          let title = '';
          let url = '';
          const titleTd = card.querySelector('td.colTitle');
          if (titleTd) {
            const link = titleTd.querySelector('a');
            if (link) {
              title = link.innerText.trim();
              url = link.href.startsWith('http') ? link.href : ('https://careers.wipro.com' + link.getAttribute('href'));
            } else {
              title = titleTd.innerText.trim();
            }
          }
          let location = '';
          const locationTd = card.querySelector('td.colLocation');
          if (locationTd) location = locationTd.innerText.trim();
          let datePosted = '';
          const dateTd = card.querySelector('td.colDate');
          if (dateTd) {
            const dateText = dateTd.innerText.trim();
            const m = dateText.match(/([A-Za-z]+) (\d{1,2}), (\d{4})/);
            if (m) {
              const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
              const month = months[m[1].slice(0,3)];
              datePosted = `${m[3]}-${month}-${m[2].padStart(2,'0')}`;
            }
          }
          return {
            title,
            location,
            datePosted,
            url
          };
        });
      });
      // Log the extracted fields for the first 5 jobs
        console.log(`[Puppeteer][DEBUG][Wipro][Page ${pageNum}] First 5 extracted jobs:`, jobs.slice(0, 5));
      jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(jobs);
        // Click the next page number if not on the last page
        if (pageNum < 5) {
          // Find the next page number button and click it
          const nextPageNum = pageNum + 1;
          const pageBtnSelector = `ul.pagination li a`;
          await page.waitForSelector(pageBtnSelector, { timeout: 10000 });
          const pageLinks = await page.$$(pageBtnSelector);
          let clicked = false;
          for (const link of pageLinks) {
            const text = await (await link.getProperty('innerText')).jsonValue();
            if (text.trim() === String(nextPageNum)) {
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
                link.click()
              ]);
              clicked = true;
              break;
            }
          }
          if (!clicked) {
            console.log(`[Puppeteer][DEBUG][Wipro] Could not find page button for page ${nextPageNum}`);
            break;
          }
        }
      }
      jobs = allJobs;
      console.log(`[Puppeteer][DEBUG][Wipro] Extracted jobs from first 5 pages:`, jobs.slice(0, 10));
    } else if (isAdobe) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
      await page.waitForSelector('li.jobs-list-item.au-target.phw-card-block-nd', { timeout: 15000 }).catch(() => {
        console.log('[Puppeteer] No Adobe job cards found after waiting.');
      });
      const debugAdobe = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('li.jobs-list-item.au-target.phw-card-block-nd'));
        return cards.map(card => card.innerText);
      });
        console.log(`[Puppeteer][DEBUG][Adobe][Page ${pageNum}] Found ${debugAdobe.length} job cards. InnerText:`, debugAdobe);
        let jobs = await page.evaluate((keywordLower) => {
        const cards = Array.from(document.querySelectorAll('li.jobs-list-item.au-target.phw-card-block-nd'));
        return cards.map(card => {
          const lines = card.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          const title = lines[0] || '';
          const location = lines[1] || '';
          const category = lines[2] || '';
          const jobId = lines[3] || '';
          const date = lines[4] || '';
          const description = lines.slice(5).join(' ');
          let url = '';
          const link = card.querySelector('a');
          if (link) {
            url = link.href || '';
          }
          return {
            title,
            url,
            location,
            function: category,
            experience: '',
            datePosted: date,
            jobId,
            description,
            skills: []
          };
        }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      }, keywordLower);
        
      // Post-process to clean Adobe jobs
      jobs = jobs.map(job => {
        // Extract date from description
        let datePosted = job.datePosted;
        const dateMatch = job.description && job.description.match(/Posted Date (\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) datePosted = dateMatch[1];
        // Use function as location if location is empty
        let location = job.location;
        if ((!location || location === 'Location') && job.function) location = job.function;
        return {
          title: job.title,
          location,
          datePosted,
          url: job.url
        };
      });
        
        jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(jobs);
        jobsPerPage.push(jobs.length);
        // Log all job titles for this page
        console.log(`[Puppeteer][Adobe][Page ${pageNum}] Found ${jobs.length} jobs:`);
        jobs.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.title} - ${job.location} - ${job.datePosted}`);
        });
        
        // Click the next page button if not on the last page
        if (pageNum < 5) {
          const nextBtnSelector = 'a[aria-label="View next page"]';
          await page.waitForSelector(nextBtnSelector, { timeout: 10000 });
          const nextBtn = await page.$(nextBtnSelector);
          if (nextBtn) {
            await nextBtn.evaluate(b => b.scrollIntoView());
            const isDisabled = await (await nextBtn.getProperty('disabled')).jsonValue().catch(() => false);
            if (!isDisabled) {
              await nextBtn.click();
              await new Promise(resolve => setTimeout(resolve, 3000));
              console.log(`[Puppeteer][Adobe] Clicked Next button for page ${pageNum + 1}.`);
            } else {
              console.log(`[Puppeteer][Adobe] Next button is disabled on page ${pageNum}.`);
              break;
            }
          } else {
            console.log(`[Puppeteer][Adobe] Could not find Next button on page ${pageNum}.`);
            break;
          }
        }
      }
      jobs = allJobs;
      // Log summary
      console.log(`[Puppeteer][Adobe] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][Adobe] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][Adobe] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isGoogle) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Debug: Print page title and some HTML to understand the structure
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          bodyText: document.body.innerText.substring(0, 1000),
          allDivs: document.querySelectorAll('div').length,
          allLinks: document.querySelectorAll('a').length
        };
      });
      console.log(`[Puppeteer][DEBUG][Google] Page title: ${pageInfo.title}`);
      console.log(`[Puppeteer][DEBUG][Google] Total divs: ${pageInfo.allDivs}, Total links: ${pageInfo.allLinks}`);
      
      // Try multiple selectors for Google job cards
      const selectors = [
        'div[data-job-id]',
        'div[class*="job"]',
        'div[class*="card"]',
        'a[href*="/jobs/"]',
        'div[class*="listing"]',
        'li[class*="job"]',
        'div[class*="position"]'
      ];
      
      let foundCards = [];
      for (const selector of selectors) {
        const cards = await page.evaluate((sel) => {
          return Array.from(document.querySelectorAll(sel)).map(el => ({
            selector: sel,
            text: el.innerText.substring(0, 200),
            html: el.outerHTML.substring(0, 500)
          }));
        }, selector);
        if (cards.length > 0) {
          console.log(`[Puppeteer][DEBUG][Google] Found ${cards.length} elements with selector "${selector}":`);
          cards.slice(0, 3).forEach((card, i) => {
            console.log(`[Puppeteer][DEBUG][Google] Card ${i + 1}: ${card.text}`);
          });
          foundCards = cards;
          break;
        }
      }
      
      // Always run the text extraction logic for Google
      let lines = pageInfo.bodyText.split('\n').map(l => l.trim()).filter(Boolean);
      console.log(`[Puppeteer][DEBUG][Google] First 40 non-blank lines:`, lines.slice(0, 40));
      let jobs = [];
      for (let i = 0; i < lines.length - 3; i++) {
        const title = lines[i];
        const locationLine = lines[i+1];
        const learnMoreLine = lines[i+2];
        const shareLine = lines[i+3];
        if (locationLine.startsWith('Google |') && learnMoreLine === 'Learn more' && shareLine === 'share') {
          const location = locationLine.replace('Google |', '').trim();
          // Try to find the corresponding 'Learn more' link in the DOM
          let url = await page.evaluate((jobTitle) => {
            const allLinks = Array.from(document.querySelectorAll('a'));
            for (const link of allLinks) {
              if (link.innerText.trim() === 'Learn more') {
                // Check if the previous sibling contains the job title
                let prev = link.parentElement;
                while (prev && prev !== document.body) {
                  if (prev.innerText && prev.innerText.includes(jobTitle)) {
                    return link.href;
                  }
                  prev = prev.parentElement;
                }
              }
            }
            return '';
          }, title);
          
          // If URL is still empty, try to find any link near the job title
          if (!url) {
            url = await page.evaluate((jobTitle) => {
              const allLinks = Array.from(document.querySelectorAll('a'));
              for (const link of allLinks) {
                // Look for links that might be job links
                if (link.href && link.href.includes('/jobs/') && link.innerText.trim() === 'Learn more') {
                  // Check if this link is near our job title
                  let container = link.closest('div, li, article, section');
                  if (container && container.innerText.includes(jobTitle)) {
                    return link.href;
                  }
                }
              }
              return '';
            }, title);
          }
          jobs.push({
            title,
            location
          });
          console.log(`[Puppeteer][DEBUG][Google] Matched job block:`, {title, location});
        }
      }
      console.log(`[Puppeteer][DEBUG][Google] FINAL Extracted jobs:`, jobs);
      jobs = jobs.filter(j => j.title && j.title.trim().length > 0);
      
      jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
      
      // Log all job titles
      console.log(`[Puppeteer][Google] Found ${jobs.length} jobs:`);
      jobs.forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.title} - ${job.location}`);
      });
      
      console.log(`[Puppeteer][Google] Total jobs extracted: ${jobs.length}`);
      console.log(`[Puppeteer][Google] First 10 jobs:`, jobs.slice(0, 10));
      
      // For Google, return jobs directly without additional filtering
      await browser.close();
      console.log(`[Puppeteer] Browser closed. Total jobs found: ${jobs.length}`);
      return jobs;
    } else if (isApple) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
        await page.waitForSelector('a[href*="/details/"]', { timeout: 15000 }).catch(() => {
          console.log('[Puppeteer] No Apple job links found after waiting.');
        });
        
        // Debug: Print page structure to understand where job details are
        const pageStructure = await page.evaluate(() => {
          const jobLinks = Array.from(document.querySelectorAll('a[href*="/details/"]'));
          return jobLinks.slice(0, 2).map(link => {
            let container = link.closest('div, li, article, section');
            return {
              linkText: link.innerText,
              containerText: container ? container.innerText : 'No container found',
              containerHTML: container ? container.outerHTML.substring(0, 500) : 'No container found'
            };
          });
        });
        console.log(`[Puppeteer][DEBUG][Apple][Page ${pageNum}] Page structure:`, JSON.stringify(pageStructure, null, 2));
        
        let jobs = await page.evaluate((keywordLower) => {
          const cards = Array.from(document.querySelectorAll('a[href*="/details/"]'));
          return cards.map(card => {
            const title = card.innerText.trim() || '';
            const url = card.href || '';
            
            // Try to find job details in the parent container
            let container = card.closest('div, li, article, section');
            let location = '';
            let function_ = '';
            let datePosted = '';
            
            if (container) {
              const containerText = container.innerText;
              const lines = containerText.split('\n').map(l => l.trim()).filter(Boolean);
              
              // Look for date patterns first
              for (let line of lines) {
                if (/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(line)) {
                  datePosted = line;
                  break;
                }
              }
              
              // Look for function/team (usually the second line after title)
              for (let i = 0; i < lines.length; i++) {
                if (lines[i] === title && i + 1 < lines.length) {
                  const nextLine = lines[i + 1];
                  if (nextLine && nextLine !== datePosted && !/^\d/.test(nextLine)) {
                    function_ = nextLine;
                    break;
                  }
                }
              }
              
              // Look for location patterns (usually not in the main container text)
              // Set a default location since these are Bangalore jobs
              location = 'Bengaluru';
            }
            
            return {
              title,
              url,
              location,
              function: function_,
              experience: '',
              datePosted,
              skills: []
            };
          }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        }, keywordLower);
        
        jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(jobs);
        jobsPerPage.push(jobs.length);
        // Log only the first 3 job titles for this page
        console.log(`[Puppeteer][Apple][Page ${pageNum}] First 3 job titles:`, jobs.slice(0, 3).map(j => j.title));
        
        // Click the next page button if not on the last page
        if (pageNum < 5) {
          const nextBtnSelector = 'button.icon.icon-chevronend';
          await page.waitForSelector(nextBtnSelector, { timeout: 10000 });
          const nextBtn = await page.$(nextBtnSelector);
          if (nextBtn) {
            await nextBtn.evaluate(b => b.scrollIntoView());
            const isDisabled = await (await nextBtn.getProperty('disabled')).jsonValue().catch(() => false);
            if (!isDisabled) {
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
                nextBtn.click()
              ]);
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log(`[Puppeteer][Apple] Clicked Next button for page ${pageNum + 1}.`);
            } else {
              console.log(`[Puppeteer][Apple] Next button is disabled on page ${pageNum}.`);
              break;
            }
          } else {
            console.log(`[Puppeteer][Apple] Could not find Next button on page ${pageNum}.`);
            break;
          }
        }
      }
      jobs = allJobs;
      // Log summary
      console.log(`[Puppeteer][Apple] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][Apple] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][Apple] First 10 jobs:`, jobs.slice(0, 10));
    } else if (isDeloitte) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let allJobs = [];
      let jobsPerPage = [];
      
      for (let pageNum = 1; pageNum <= 5; pageNum++) {
        console.log(`[Puppeteer][Deloitte] Processing page ${pageNum}...`);
        
        // Wait for job links to load
        await page.waitForSelector('a[href*="/job/"]', { timeout: 15000 }).catch(() => {
          console.log('[Puppeteer] No Deloitte job links found after waiting.');
        });
        
        // Extract jobs from current page
        let jobs = await page.evaluate((keywordLower) => {
          const cards = Array.from(document.querySelectorAll('a[href*="/job/"]'));
          return cards.map(card => {
            const title = card.innerText.trim() || '';
            const url = card.href || '';
            
            // Try to find job details in the parent container
            let container = card.closest('div, li, article, section');
            let location = '';
            let function_ = '';
            let datePosted = '';
            
            if (container) {
              const containerText = container.innerText;
              const lines = containerText.split('\n').map(l => l.trim()).filter(Boolean);
              
              // Look for location and date combined (e.g., "Bengaluru, IN\tJul 14, 2025")
              for (let line of lines) {
                if (line.includes('\t') && /[A-Za-z]+, IN\t[A-Za-z]{3} \d{1,2}, \d{4}/.test(line)) {
                  const parts = line.split('\t');
                  if (parts.length === 2) {
                    location = parts[0].trim();
                    datePosted = parts[1].trim();
                    break;
                  }
                }
              }
              
              // If not found in combined format, look for separate patterns
              if (!location || !datePosted) {
                for (let line of lines) {
                  // Look for location patterns
                  if (/[A-Za-z]+, IN$/.test(line)) {
                    location = line;
                  }
                  // Look for date patterns
                  else if (/[A-Za-z]{3} \d{1,2}, \d{4}/.test(line)) {
                    datePosted = line;
                  }
                }
              }
            }
            
            return {
              title,
              url,
              location,
              function: function_,
              experience: '',
              datePosted,
              skills: []
            };
          }).filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        }, keywordLower);
        
        // Filter jobs by keyword
        jobs = jobs.filter(j => keywordLower === '' || (j.title && j.title.toLowerCase().includes(keywordLower)));
        allJobs = allJobs.concat(jobs);
        jobsPerPage.push(jobs.length);
        
        console.log(`[Puppeteer][Deloitte][Page ${pageNum}] Extracted ${jobs.length} jobs:`);
        jobs.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.title} - ${job.location} - ${job.datePosted}`);
        });
        
        // Navigate to next page if not on the last page
        if (pageNum < 5) {
          try {
            // Look for the next page number link based on the screenshot
            const nextPageNum = pageNum + 1;
            const pageLinkSelector = `ul.pagination li a`;
            await page.waitForSelector(pageLinkSelector, { timeout: 10000 });
            const pageLinks = await page.$$(pageLinkSelector);
            
            let clicked = false;
            for (const link of pageLinks) {
              const text = await (await link.getProperty('innerText')).jsonValue();
              if (text.trim() === String(nextPageNum)) {
                await link.evaluate(b => b.scrollIntoView());
                await Promise.all([
                  page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
                  link.click()
                ]);
                await new Promise(resolve => setTimeout(resolve, 3000));
                clicked = true;
                console.log(`[Puppeteer][Deloitte] Clicked page ${nextPageNum} link.`);
                break;
              }
            }
            
            if (!clicked) {
              console.log(`[Puppeteer][Deloitte] Could not find page ${nextPageNum} link.`);
              break;
            }
          } catch (error) {
            console.log(`[Puppeteer][Deloitte] Error navigating to next page: ${error.message}`);
            break;
          }
        }
      }
      
      // Remove duplicates based on title and URL
      const uniqueJobs = [];
      const seenJobs = new Set();
      for (const job of allJobs) {
        const jobKey = `${job.title}|${job.url}`;
        if (!seenJobs.has(jobKey)) {
          seenJobs.add(jobKey);
          uniqueJobs.push(job);
        }
      }
      jobs = uniqueJobs;
      
      // Log summary
      console.log(`[Puppeteer][Deloitte] Pagination summary: jobs per page:`, jobsPerPage);
      console.log(`[Puppeteer][Deloitte] Total jobs extracted from first 5 pages: ${jobs.length}`);
      console.log(`[Puppeteer][Deloitte] First 10 jobs:`, jobs.slice(0, 10));
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
      const nextBtnSelector = 'button[aria-label="Go to next page"]';
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