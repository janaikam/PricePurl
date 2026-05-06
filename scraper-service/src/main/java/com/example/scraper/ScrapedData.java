package com.example.scraper;

public class ScrapedData {
    private String siteName;
    private String name;
    private String price;
    private String date; // ISO 8601 string

    public ScrapedData() {}

    public ScrapedData(String siteName, String name, String price, String date) {
        this.siteName = siteName;
        this.name = name;
        this.price = price;
        this.date = date;
    }

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }
}