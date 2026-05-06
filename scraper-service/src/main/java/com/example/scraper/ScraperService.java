package com.example.scraper;

import java.net.URI;

public class ScraperService {

    public Scraper getScraper(String url) {
        try {
            URI uri = new URI(url);
            String host = uri.getHost();
            if (host != null && host.contains("hobbii.com")) {
                return new HobbiiScraper();
            }
        } catch (Exception e) {
            // fallback to generic
        }
        return new GenericScraper();
    }
}