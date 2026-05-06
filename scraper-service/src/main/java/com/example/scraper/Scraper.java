package com.example.scraper;

public interface Scraper {
    ScrapedData scrape(String url, String siteName) throws Exception;
}