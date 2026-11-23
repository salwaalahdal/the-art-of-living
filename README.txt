THE ART OF LIVING — CINEMA EDITION
CCSW321 Web Development — Assignment 2

FILES
- index.html: page structure and forms
- style.css: classic European cinema visual design
- app.js: TMDB AJAX requests, dynamic DOM, events, favorites and error handling

RUN
1. Unzip the project.
2. Open the folder in VS Code.
3. Run index.html with Live Server.
4. Create a free TMDB account and request a developer API Read Access Token.
5. In the website, scroll to Connection Settings, paste the token, and click CONNECT TO TMDB.
6. Search for a film, try the filters, open a film card, save favorites, and use Surprise Me.

GET A TMDB TOKEN
https://www.themoviedb.org/signup
Then: Account Settings > API > API Read Access Token.
Official documentation: https://developer.themoviedb.org/docs/getting-started

ASSIGNMENT FEATURES
- AJAX: fetch() with async/await and Authorization Bearer token
- Form: film search with year, rating and genre filters
- Event types: submit, keyup, change, click, dblclick, load
- Dynamic DOM creation: movie result cards and saved collection cards
- Dynamic DOM removal: clear results, remove saved films, clear token
- API data shown: title, poster, overview, release date, vote average, vote count, genre
- Error handling: missing token, invalid token, rate limit, network/API errors, no matches
- Responsive layout

IMPORTANT
TMDB requires a developer credential. The project includes a token field so you can paste your own Read Access Token; no token has been embedded in the ZIP.
The token is stored in localStorage in this browser for convenience. Do not publish your personal token in a public repository.
This product uses the TMDB API but is not endorsed or certified by TMDB.
API data and images are supplied by The Movie Database (TMDB).
Confirm that TMDB is not already selected by a classmate before final submission, as the assignment requires a distinct API.
