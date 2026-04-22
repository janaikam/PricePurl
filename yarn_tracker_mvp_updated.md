# 🧶 Yarn Price Tracker MVP (Updated with Manual Input)

## Overview

This MVP is a local-first application that allows users to: - Track yarn
prices via URLs (scraped) - Manually input yarn prices - Store and
manage tracked yarn locally - Refresh scraped prices

No authentication or external database is required.

------------------------------------------------------------------------

## 🎯 MVP Goals

-   Add yarn with URL and/or manual price
-   Store yarn data in localStorage
-   Fetch prices using backend scraping (Puppeteer)
-   Display tracked yarn in a dashboard
-   Refresh prices for scraped items only

------------------------------------------------------------------------

## 🧱 Tech Stack

### Frontend

-   React (Vite)
-   Axios
-   LocalStorage

### Backend

-   Node.js + Express
-   Puppeteer (for scraping)

------------------------------------------------------------------------

## 📁 Project Structure

    yarn-price-tracker/
    ├── backend/
    │   ├── server.js
    │   ├── scraper.js
    │   └── package.json
    │
    ├── frontend/
    │   ├── index.html
    │   ├── package.json
    │   └── src/
    │       ├── App.jsx
    │       ├── main.jsx
    │       ├── api.js
    │       ├── storage.js
    │       ├── components/
    │       │   ├── AddYarn.jsx
    │       │   ├── YarnList.jsx
    │       │   └── YarnItem.jsx
    │
    └── README.md

------------------------------------------------------------------------

## 🗄️ Data Model

Each yarn item:

``` json
{
  "id": "uuid",
  "name": "string",
  "url": "string (optional)",
  "currentPrice": "string",
  "lastChecked": "timestamp",
  "priceSource": "manual | scraped"
}
```

------------------------------------------------------------------------

## 🔄 Core Logic

### Add Yarn

-   If user enters a price:
    -   Save as manual
-   If user enters URL only:
    -   Fetch price from backend
    -   Save as scraped
-   If both provided:
    -   Use manual price

------------------------------------------------------------------------

### Refresh Price

-   Only allowed if `priceSource === "scraped"`
-   Calls backend to fetch updated price
-   Updates localStorage

------------------------------------------------------------------------

## 💾 Storage

-   Use localStorage
-   Key: `yarnList`
-   Store as JSON array

------------------------------------------------------------------------

## 🔎 Backend Scraping Flow

1.  Receive URL via POST request
2.  Launch Puppeteer browser
3.  Navigate to page
4.  Extract price using selector
5.  Return price

------------------------------------------------------------------------

## ⚠️ Constraints

-   Scraping selectors vary by site
-   Some sites may block scraping
-   Performance is not optimized (acceptable for MVP)

------------------------------------------------------------------------

## 🚀 Future Enhancements

-   Replace localStorage with Supabase
-   Add user authentication
-   Link yarn to projects
-   Add notifications
-   Track price history

------------------------------------------------------------------------

## 🧠 Development Strategy

1.  Build frontend with manual input only
2.  Add localStorage persistence
3.  Display yarn list
4.  Add backend scraping
5.  Enable refresh functionality

------------------------------------------------------------------------

## ✅ MVP Success Criteria

-   User can add yarn manually
-   User can add yarn via URL
-   Prices are stored and displayed
-   Scraped prices can be refreshed
-   App works fully locally
