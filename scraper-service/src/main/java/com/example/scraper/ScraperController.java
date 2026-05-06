package com.example.scraper;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ScraperController {

    private final ScraperService scraperService = new ScraperService();

    @PostMapping("/scrape")
    public ScrapedData scrape(@RequestBody ScrapeRequest request) {
        try {
            Scraper scraper = scraperService.getScraper(request.getUrl());
            return scraper.scrape(request.getUrl());
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