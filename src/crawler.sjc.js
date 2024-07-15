const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const schedule = require('node-schedule');

const DATA_DIR = 'src/data';
const RESULT_DIR = 'src/results';

// Read file data from command line
const args = process.argv.slice(2);
const fileName = args[0];

async function crawl(target) {
  try {
    const { url, selectors } = target;

    // Fetch the HTML content of the page
    const response = await axios.get(url);
    const html = response.data;

    // Load the HTML into cheerio
    const $ = cheerio.load(html);

    // Extract data based on the selectors
    // const data = {};
    // for (const key in selectors) {
    //   data[key] = $(selectors[key]).text().trim();
    // }

    const count = $(selectors.count).length;
    // Create array with length is count
    const prices = Array.from({ length: count }).map((_, index) => {
      return {
        type: $(selectors.count).eq(index).text().trim(),
        buy: $(selectors.buy).eq(index).text().trim(),
        sell: $(selectors.sell).eq(index).text().trim()
      };
    });


    const data = {
      updateTime: $(selectors.updateTime).text().trim(),
      unit: $(selectors.unit).text().trim(),
      prices: Array.from({ length: count }).map((_, index) => {
        return {
          type: $(selectors.count).eq(index).text().trim(),
          buy: $(selectors.buy).eq(index).text().trim(),
          sell: $(selectors.sell).eq(index).text().trim()
        };
      }),
      timestamp: new Date().toISOString()
    };

    // Output the extracted data (or store it as needed)
    console.log(`Data from ${url}:`, data);
    const result = {
      url,
      data,
      timestamp: new Date().toISOString()
    };
    // Append result to results.json
    let results = [];
    const resultFile = `${RESULT_DIR}/results.jsc.json`;
    if (fs.existsSync(resultFile)) {
      results = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));
    }
    results.push(result);
    fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));

    console.log(`Data from ${url} stored at ${result.timestamp}`);
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
  const config = JSON.parse(fs.readFileSync(`${DATA_DIR}/sjc.craw.json`, 'utf-8'));

  // Schedule each target based on its defined schedule
  config.targets.forEach(target => {
    scheduleCrawling(target);
    console.log(`Scheduled crawling for ${target.url} at ${target.schedule}`);
  });

  console.log('Crawling schedules have been set.');
}

startCrawler();
