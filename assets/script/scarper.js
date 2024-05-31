import fs from 'fs';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import PQueue from 'p-queue';

console.log("oui");

const linkList = new Set();
const visitedLinks = new Set();
const MAX_DEPTH = 2;
const DELAY = 5000; // 5 seconds delay
const MAX_CONCURRENT_REQUESTS = 5; // Maximum number of concurrent requests
const MAX_RETRIES = 3; // Number of retries for failed requests

const queue = new PQueue({ concurrency: MAX_CONCURRENT_REQUESTS });

function scratch(link, depth = 0) {
    if (depth > MAX_DEPTH || visitedLinks.has(link)) {
        return;
    }

    visitedLinks.add(link);
    queue.add(() => processLink(link, depth));
}

async function processLink(link, depth, retries = 0) {
    try {
        const response = await axios.get(link, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const dom = new JSDOM(response.data);
        const newLinks = [];

        [...dom.window.document.querySelectorAll('a')].forEach(el => {
            const href = el.href;
            // Ensure the link is an absolute URL
            if (href.startsWith('http') || href.startsWith('https')) {
                newLinks.push(href);
            }
        });

        newLinks.forEach(newLink => linkList.add(newLink));

        newLinks.forEach(newLink => scratch(newLink, depth + 1));

        saveLinksToJSON(Array.from(linkList));
    } catch (error) {
        console.error(`Error fetching ${link}:`, error.message);
        if (retries < MAX_RETRIES) {
            console.log(`Retrying ${link} (${retries + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, DELAY));
            return processLink(link, depth, retries + 1);
        } else {
            console.log(`Failed to fetch ${link} after ${MAX_RETRIES} retries. Ignoring this link.`);
        }
    } finally {
        // Wait for a delay before processing the next item in the queue
        await new Promise(resolve => setTimeout(resolve, DELAY));
    }
}

function saveLinksToJSON(links) {
    const filePath = 'data.json';

    // Read existing data from file
    let existingData = [];
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(data).links;
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error('Error reading existing data:', err);
        }
    }

    // Combine new links with existing ones
    const allLinks = Array.from(new Set([...existingData, ...links]));

    // Write combined data back to file
    fs.writeFile(filePath, JSON.stringify({ links: allLinks }, null, 2), err => {
        if (err) {
            console.error('Error writing data to file:', err);
        } else {
            console.log('Data saved to data.json');
        }
    });
}

// Function to keep the process alive
function keepAlive() {
    setInterval(() => {
        console.log('Keeping the process alive...');
    }, 60000); // Print a message every minute
}

// Start the scraping process and keep the process alive
scratch("https://fr.wikipedia.org/wiki/Donald_Trump");
keepAlive();
