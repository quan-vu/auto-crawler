const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const schedule = require('node-schedule');

const DATA_DIR = 'src/data';

async function crawl(target) {
  try {
    const { url, selectors } = target;

    // Fetch the HTML content of the page
    const response = await axios.get(url);
    const html = response.data;

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    // Extract data based on the selectors
    const data = {};
    for (const key in selectors) {
      data[key] = $(selectors[key]).text().trim();
    }

    // Output the extracted data (or store it as needed)
    console.log(`Data from ${url}:`, data);
  } catch (error) {
    console.error(`Error crawling ${target.url}:`, error);
  }
}

function scheduleCrawling(target) {
  const { schedule: scheduleTime } = target;
  
  schedule.scheduleJob(scheduleTime, () => {
    crawl(target);
  });
}

function startCrawler() {
  const config = JSON.parse(fs.readFileSync(`${DATA_DIR}/sample.craw.json`, 'utf-8'));

  // Schedule each target based on its defined schedule
  config.targets.forEach(target => {
    scheduleCrawling(target);
    console.log(`Scheduled crawling for ${target.url} at ${target.schedule}`);
  });

  console.log('Crawling schedules have been set.');
}

startCrawler();
