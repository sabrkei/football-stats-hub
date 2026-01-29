# Football Stats Hub

A web application for football enthusiasts to explore data about clubs and stadiums. This project provides two main features: viewing detailed information about club venues and comparing the head-to-head (H2H) history between two teams. The application is built with native JavaScript and fetches live data from the [API-Football](https://www.api-football.com/) service.

## Features

### 1. Venue Explorer

This page allows users to find information about the stadiums of teams in Europe's top leagues.

- **Select a League**: Choose from one of the top 5 European leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1).
- **Select a Team**: A dropdown will populate with all the teams from the selected league.
- **View Venue Details**: After selecting a team, the application displays its stadium details, including a stadium image, name, city, and capacity.
- **Caching**: Team data is cached in the browser's `localStorage` to provide a faster experience and reduce API calls on subsequent visits.

### 2. Club Head-to-Head (H2H) Comparison

This page allows users to compare the historical match results between any two clubs.

- **Select Countries and Teams**: For each of the two teams, first select a country, then search for and select the club from the populated list.
- **Fetch H2H Data**: Once two valid teams are selected, click the "Search" button to view a detailed comparison.
- **View Results**: The results include:
    - A summary of statistics (total wins for each team, draws, and goals scored).
    - A full match history table sorted by date.
- **Caching**: Country lists, team lists, and H2H results are all cached to optimize performance and minimize API usage.

## Technical Details

- **Frontend**: HTML, CSS, Native JavaScript (ES6+)
- **Data Source**: API-Football by API-Sports
- **Key JavaScript Concepts**:
    - Asynchronous API calls using `fetch` and `async/await`.
    - Dynamic DOM manipulation to build the user interface.
    - Client-side caching with `localStorage` to store API data.

## Inspiration and Media

- **Design Inspiration**: The UI/UX was inspired by popular football statistics websites like Transfermarkt and WhoScored.
- **Media Files**: All images and the background video used in the project are AI-generated and were downloaded from Freepik.com. No attribution was required.
