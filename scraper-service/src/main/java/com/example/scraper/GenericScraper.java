package com.example.scraper;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import java.util.Map;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class GenericScraper implements Scraper {

    @Override
    public ScrapedData scrape(String url, String siteName) throws Exception {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch();
            BrowserContext context = browser.newContext();
            Page page = context.newPage();

            page.navigate(url);

            @SuppressWarnings("unchecked")
            Map<String, String> result = (Map<String, String>) page.evaluate("""
                () => {
                    let name = null;
                    let price = null;

                    // Common name selectors
                    const nameSelectors = [
                        '.product-title',
                        '.product-name',
                        'h1',
                        '.title',
                        '[data-product-title]',
                        '.item-title',
                        '.product-header h1',
                        '.product-info h1',
                        '.product-details h1',
                        '[itemprop="name"]',
                        '.product-name-text',
                        '.item-name',
                        'h1.product-title',
                        '.page-title'
                    ];

                    for (let selector of nameSelectors) {
                        const element = document.querySelector(selector);
                        if (element && element.textContent.trim()) {
                            name = element.textContent.trim();
                            break;
                        }
                    }

                    // Fallback for name: look for title tag or first meaningful h1/h2
                    if (!name) {
                        const titleEl = document.querySelector('title');
                        if (titleEl && titleEl.textContent.trim()) {
                            name = titleEl.textContent.trim().split('|')[0].trim();
                        }
                    }

                    if (!name) {
                        const headers = document.querySelectorAll('h1, h2');
                        for (let header of headers) {
                            if (header.textContent.trim().length > 3) {
                                name = header.textContent.trim();
                                break;
                            }
                        }
                    }

                    // Common price selectors
                    const priceSelectors = [
                        '.price',
                        '.product-price',
                        '[data-price]',
                        '.current-price',
                        '.sale-price',
                        '.regular-price',
                        '.price-current',
                        '.product-price-current',
                        '.price-amount',
                        '.current-price span',
                        '.price-value',
                        '[itemprop="price"]',
                        '.price-display',
                        '.offer-price',
                        '.final-price',
                        '.item-price'
                    ];

                    for (let selector of priceSelectors) {
                        const element = document.querySelector(selector);
                        if (element && element.textContent.trim()) {
                            const priceText = element.textContent.trim();
                            const priceMatch = priceText.match(/\\$\\d+,?\\d*\\.\\d{2}/);
                            if (priceMatch) {
                                price = priceMatch[0];
                                break;
                            }
                        }
                    }

                    return { name: name, price: price };
                }
                """);

            browser.close();
            String date = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            return new ScrapedData(siteName, result.get("name"), result.get("price"), date);
        }
    }
}