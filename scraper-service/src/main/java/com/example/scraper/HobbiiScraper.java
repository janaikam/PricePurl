package com.example.scraper;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import java.util.Map;

public class HobbiiScraper implements Scraper {

    @Override
    public ScrapedData scrape(String url) throws Exception {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch();
            BrowserContext context = browser.newContext();
            Page page = context.newPage();

            page.navigate(url);

            Map<String, String> result = (Map<String, String>) page.evaluate("""
                () => {
                    let name = null;
                    let price = null;

                    // Hobbii specific selectors
                    const h1 = document.querySelector('h1');
                    if (h1) {
                        name = h1.textContent.trim();
                    }

                    // Price selector for hobbii - look for the price element
                    const priceElement = document.querySelector('.price, [data-price]');
                    if (priceElement) {
                        const priceText = priceElement.textContent.trim();
                        // Extract the current price (first $ amount)
                        const priceMatch = priceText.match(/\\$\\d+,?\\d*\\.\\d{2}/);
                        if (priceMatch) {
                            price = priceMatch[0];
                        }
                    }

                    return { name: name, price: price };
                }
                """);

            browser.close();
            return new ScrapedData(result.get("name"), result.get("price"));
        }
    }
}