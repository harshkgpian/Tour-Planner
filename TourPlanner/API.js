const axios = require('axios');  
const cheerio = require('cheerio');  
const puppeteer = require('puppeteer');  

const API_KEY = 'API_KEY';  
const CSE_ID = 'CSE_ID';  

async function googleArticleSearch(query, numResults = 5) {  
    const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${API_KEY}&cx=${CSE_ID}&num=${numResults}`;  
    try {  
        const response = await axios.get(searchUrl);  
        const items = response.data.items || [];  
        const filteredItems = items.filter(item => {  
            const link = item.link;  
            return !link.includes("researchgate.net") &&  
                   !link.includes("affiliate") &&  
                   !link.includes("login") &&  
                   !link.includes("javascript:void");  
        });  
        if (filteredItems.length === 0) {  
            throw new Error("No relevant articles found.");  
        }  
        return filteredItems[0].link;  
    } catch (error) {  
        console.error(`Search Error for query "${query}":`, error.message);  
        return null;  
    }  
}  

async function fetchFullArticle(url) {  
    let browser; // Declare browser outside the try block for proper cleanup  
    try {  
        // Launch Puppeteer  
        browser = await puppeteer.launch();  
        const page = await browser.newPage();  

        // Set a default navigation timeout  
        await page.setDefaultNavigationTimeout(30000);  

        // Set a user agent to avoid being blocked  
        await page.setUserAgent(  
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'  
        );  

        // Navigate to the URL  
        await page.goto(url, { waitUntil: 'domcontentloaded' });  

        // Extract all visible text from the page  
        const content = await page.evaluate(() => document.body.innerText);  

        return content; // Return the extracted content  
    } catch (error) {  
        console.error(`Scraping Error for URL "${url}":`, error.message);  
        return "Unable to extract meaningful content from this URL.";  
    } finally {  
        // Ensure the browser is closed even if an error occurs  
        if (browser) {  
            await browser.close();  
        }  
    }  
}  

// async function searchAndScrapeArticles(queries) {  
//     for (const query of queries) {  
//         console.log(`Searching for: "${query}"`);  
//         const articleUrl = await googleArticleSearch(query);  
//         if (!articleUrl) {  
//             console.log("No article found for this query.");  
//             continue;  
//         }  
//         console.log(`Found article URL: ${articleUrl}`);  
//         const articleContent = await fetchFullArticle(articleUrl);  
//         if (articleContent) {  
//             console.log(`Article Content for "${query}":\n`, articleContent);  
//         } else {  
//             console.log("Failed to retrieve the article content.");  
//         }  
//     }  
// }  

const queries = [  
    "Best art and history tours in Paris under 150 euros",  
    "Top museums to visit in Paris within budget"  
];  

// searchAndScrapeArticles(queries);  

module.exports = {
    googleArticleSearch,
    fetchFullArticle
};