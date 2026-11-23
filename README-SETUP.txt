THE ART OF LIVING — SECURE TMDB CONNECTION
===========================================

This version removes the token field from the public website. The browser calls
a Vercel serverless function, and that function calls TMDB using a secret stored
in Vercel Environment Variables.

FILES
-----
index.html, style.css, app.js : your existing cinema website
api/tmdb.js                  : secure server-side TMDB proxy
README-SETUP.txt             : deployment steps

IMPORTANT
---------
Do not paste your TMDB token into app.js, index.html, GitHub, or this README.
Do not send the token in chat. Add it only in Vercel's Environment Variables.

SETUP
-----
1. Upload this project folder to a NEW GitHub repository, or add these files to
   your existing project. Keep the api folder at the repository root.
2. Import that repository into Vercel and deploy it.
   Vercel automatically deploys files in the /api directory as Functions.
3. In Vercel: Project > Settings > Environment Variables, add:
      Name:  TMDB_READ_ACCESS_TOKEN
      Value: your TMDB API Read Access Token
   Add another variable:
      Name:  FRONTEND_ORIGIN
      Value: https://YOUR-GITHUB-USERNAME.github.io
   If your GitHub Pages site is hosted under a project path, the origin is still
   the scheme + host only, for example https://username.github.io (no /repo-name).
4. Save the variables and REDEPLOY the Vercel project.
5. Copy the deployed function URL. It will look like:
      https://your-project.vercel.app/api/tmdb
6. Open app.js and replace:
      https://YOUR-VERCEL-PROJECT.vercel.app/api/tmdb
   with your real Vercel function URL.
7. Commit and push the updated app.js to GitHub Pages.
8. Open the public website in a private/incognito window and test:
   - Trending Now loads automatically.
   - Search a film.
   - Change year, rating and genre filters.
   - Open a film and save/remove it from the collection.

LOCAL TESTING
-------------
The frontend cannot call the Vercel function until it is deployed and the URL
has been added to app.js. You can still open the Vercel deployment URL to test
the backend-hosted site, or use the GitHub Pages site after step 7.

SECURITY NOTES
--------------
- The TMDB token stays on the server; visitors do not need a TMDB account/token.
- FRONTEND_ORIGIN is a browser CORS restriction, not full API security. A public
  endpoint can still be called outside a browser. For a public production site,
  add rate limiting/abuse protection and monitor TMDB usage.
- This proxy only allows the four TMDB endpoints used by this project.
- Favorites are still saved in localStorage on each browser. They are NOT yet
  synced across devices or accounts. A separate authentication + database step
  (for example Supabase Auth + PostgreSQL with row-level security) is needed
  for individual user accounts and cloud-synced collections.

TMDB AUTHENTICATION
-------------------
TMDB's API Read Access Token is sent as an Authorization: Bearer token.
Official documentation:
https://developer.themoviedb.org/docs/authentication-application

Vercel Functions:
https://vercel.com/docs/functions
Vercel Environment Variables:
https://vercel.com/docs/environment-variables
