package com.example.scraper;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

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
                    let currentPrice = null;
                    let regularPrice = null;

                    const parsePrice = (value) => {
                        if (!value) {
                            return null;
                        }

                        const match = value.match(/\\$\\d+,?\\d*\\.\\d{2}/);
                        return match ? match[0] : null;
                    };

                    const toNumericPrice = (value) => {
                        if (!value) {
                            return null;
                        }

                        const normalized = value.replace(/[^0-9.]/g, '');
                        const parsed = Number.parseFloat(normalized);
                        return Number.isFinite(parsed) ? parsed : null;
                    };

                    const firstPriceFromSelectors = (selectors) => {
                        for (const selector of selectors) {
                            const element = document.querySelector(selector);
                            if (!element || !element.textContent.trim()) {
                                continue;
                            }

                            const price = parsePrice(element.textContent.trim());
                            if (price) {
                                return price;
                            }
                        }

                        return null;
                    };

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

                    for (const selector of nameSelectors) {
                        const element = document.querySelector(selector);
                        if (element && element.textContent.trim()) {
                            name = element.textContent.trim();
                            break;
                        }
                    }

                    if (!name) {
                        const titleEl = document.querySelector('title');
                        if (titleEl && titleEl.textContent.trim()) {
                            name = titleEl.textContent.trim().split('|')[0].trim();
                        }
                    }

                    if (!name) {
                        const headers = document.querySelectorAll('h1, h2');
                        for (const header of headers) {
                            if (header.textContent.trim().length > 3) {
                                name = header.textContent.trim();
                                break;
                            }
                        }
                    }

                    const currentPriceSelectors = [
                        '.current-price',
                        '.sale-price',
                        '.price-current',
                        '.product-price-current',
                        '.offer-price',
                        '.final-price',
                        '[data-sale-price]',
                        '[itemprop="price"]',
                        '.current-price span'
                    ];

                    const regularPriceSelectors = [
                        '.compare-at-price',
                        '.original-price',
                        '.was-price',
                        '.regular-price',
                        '.list-price',
                        '.msrp-price',
                        '.old-price',
                        '.price--compare',
                        '.price--strikethrough',
                        '[data-compare-at-price]',
                        '[data-original-price]',
                        '[data-was-price]'
                    ];

                    const fallbackPriceSelectors = [
                        '.price',
                        '.product-price',
                        '[data-price]',
                        '.price-amount',
                        '.price-value',
                        '.price-display',
                        '.item-price'
                    ];

                    currentPrice = firstPriceFromSelectors(currentPriceSelectors);
                    regularPrice = firstPriceFromSelectors(regularPriceSelectors);

                    if (!currentPrice) {
                        currentPrice = firstPriceFromSelectors(fallbackPriceSelectors);
                    }

                    if (!currentPrice || !regularPrice) {
                        const priceRegex = /\\$\\d+,?\\d*\\.\\d{2}/g;
                        const distinctPrices = new Set();

                        for (const element of document.querySelectorAll('body *')) {
                            const textContent = element.textContent?.trim();
                            if (!textContent || textContent.length > 120) {
                                continue;
                            }

                            const matches = textContent.match(priceRegex);
                            if (matches) {
                                matches.forEach((price) => distinctPrices.add(price));
                            }
                        }

                        const sortedPrices = Array.from(distinctPrices)
                            .map((price) => ({ label: price, value: toNumericPrice(price) }))
                            .filter((price) => price.value !== null)
                            .sort((left, right) => left.value - right.value);

                        if (!currentPrice && sortedPrices.length > 0) {
                            currentPrice = sortedPrices[0].label;
                        }

                        if (!regularPrice && sortedPrices.length > 1) {
                            regularPrice = sortedPrices[sortedPrices.length - 1].label;
                        }
                    }

                    if (currentPrice && regularPrice && toNumericPrice(regularPrice) <= toNumericPrice(currentPrice)) {
                        regularPrice = null;
                    }

                    return { name, currentPrice, regularPrice };
                }
                """);

            browser.close();
            String date = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            return new ScrapedData(siteName, result.get("name"), result.get("currentPrice"), result.get("regularPrice"), date);
        }
    }
}