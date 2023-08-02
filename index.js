
// Import the required modules
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const cron = require('node-cron');
const express = require('express');
const path = require('path');

// Define the URL to scrape
const url = 'https://www.skysports.com/football/news';

// Define the directory to save the text files
const dirName = 'articles';

// Define the random delay range in milliseconds (e.g. 5000 to 10000 ms)
const minDelayMs = 5000;
const maxDelayMs = 10000;

// Define a function to generate a random delay within the given range
function getRandomDelay() {
  const delayMs =
    Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

// Define a function to scrape the articles and save them to a text file
async function scrapeAndSaveArticles() {
  try {
    // Send a GET request to the URL
    const response = await axios.get(url);

    // Load the HTML content using Cheerio
    const $ = cheerio.load(response.data);

    // Find all the article elements with the "news-list__item" class
    const articles = $('li.news-list__item');

    // Create an array to store the article content
    const contentArray = [];

    // Loop through the articles and extract the headline and article content
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];

      // Extract the headline text
      const headline = $(article)
        .find('a.news-list__headline-link')
        .text()
        .trim();

      // Extract the article content
      const content = $(article).find('p.news-list__snippet').text().trim();

      // Add the headline and content to the array
      contentArray.push(
        `Date: ${new Date().toDateString()}\n\nURL: ${url}\n\n${headline}\n\n${content}\n\n`
      );

      // Generate a random delay before the next request
      await getRandomDelay();
    }

    // Create the directory if it does not exist
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName);
    }

    // Write the article content to a text file with a random filename
    const filePath = path.join(dirName, `${Date.now()}.txt`);
    fs.writeFileSync(filePath, contentArray.join('\n'));

    console.log(`Articles scraped and saved to file: ${filePath}`);
  } catch (error) {
    console.log(error);
  }
} // Schedule the job to run everyday at 12:00 CAT
cron.schedule('0 12 * * *', scrapeAndSaveArticles);

// Create an Express app
const app = express();

// Define a route to send the list of text files to the client
app.get('/news', (req, res) => {
  // Get the list of text files in the directory
  const files = fs.readdirSync(dirName);

  // Create an array of objects with the filename and date for each file
  const fileList = files.map((file) => {
    const stats = fs.statSync(path.join(dirName, file));
    return {
      file: file,
      date: stats.mtime.toLocaleDateString(),
    };
  });

  // Send the list of text files to the client
  res.send(`
                                                                                                                                                                                                  <h1>List of articles:</h1>
                                                                                                                                                                                                      ${fileList
                                                                                                                                                                                                        .map(
                                                                                                                                                                                                          (
                                                                                                                                                                                                            file
                                                                                                                                                                                                          ) =>
                                                                                                                                                                                                            `<p><a href="/${dirName}/${file.file}" download>${file.date} - ${file.file}</a></p>`
                                                                                                                                                                                                        )
                                                                                                                                                                                                        .join(
                                                                                                                                                                                                          '\n'
                                                                                                                                                                                                        )}
                                                                                                                                                                                                        `);
});

// Serve the text files from the directory
app.use(`/${dirName}`, express.static(dirName));

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server started on port 3000.');
});
