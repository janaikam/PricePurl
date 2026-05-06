package com.example.scraper;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ScraperController {

    private final ScraperService scraperService = new ScraperService();

    @PostMapping("/scrape")
    public ScrapedData scrape(@RequestBody ScrapeRequest request) {
        try {
            String url = request.getUrl();
            Scraper scraper = scraperService.getScraper(url);
            String siteName = scraperService.extractSiteName(url);
            return scraper.scrape(url, siteName);
        } catch (Exception e) {
            throw new RuntimeException("Failed to scrape: " + e.getMessage());
        }
    }

    public static class ScrapeRequest {
        private String url;

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }
    }
}