package com.example.scraper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class HobbiiScraper implements Scraper {

    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public ScrapedData scrape(String url, String siteName) throws Exception {
        // Extract product handle from URL (e.g. /products/hp-1004384-dahlia-mixo)
        URI uri = new URI(url);
        String[] pathParts = uri.getPath().split("/");
        String handle = null;
        for (int i = 0; i < pathParts.length - 1; i++) {
            if ("products".equals(pathParts[i])) {
                handle = pathParts[i + 1];
                break;
            }
        }
        if (handle == null) throw new Exception("Could not extract product handle from URL");

        // Extract variant ID from query string
        String variantId = null;
        String query = uri.getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                if (param.startsWith("variant=")) {
                    variantId = param.substring("variant=".length());
                    break;
                }
            }
        }

        // Call Shopify product JSON API
        String jsonUrl = "https://hobbii.com/products/" + handle + ".json";
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(jsonUrl))
            .header("User-Agent", "Mozilla/5.0")
            .GET()
            .build();
        HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

        JsonNode root = MAPPER.readTree(response.body());
        JsonNode product = root.path("product");

        String name = product.path("title").asText(null);
        String price = null;

        JsonNode variants = product.path("variants");
        JsonNode selectedVariant = null;
        if (variantId != null) {
            for (JsonNode v : variants) {
                if (variantId.equals(String.valueOf(v.path("id").asLong()))) {
                    selectedVariant = v;
                    break;
                }
            }
        }
        if (selectedVariant == null && variants.size() > 0) {
            selectedVariant = variants.get(0);
        }
        if (selectedVariant != null) {
            String rawPrice = selectedVariant.path("price").asText(null);
            if (rawPrice != null) {
                price = "$" + String.format("%.2f", Double.parseDouble(rawPrice));
            }
        }

        String date = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        return new ScrapedData(siteName, name, price, date);
    }
}