/* The Art of Living — Cinema Archive
   CCSW321: AJAX, DOM creation/removal, forms, events and error handling. */
// Your deployed Vercel API endpoint.
const BACKEND_URL = "https://the-art-of-living-amber.vercel.app/api/tmdb";
const IMAGE_BASE = "https://image.tmdb.org/t/p/";
const FAVORITES_KEY = "artOfLivingFavorites";
const SURPRISE_HISTORY_KEY = "artOfLivingSurpriseHistory";
let currentPage = 1;
let currentQuery = "";
let currentResults = [];
let genres = [];
let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");

const $ = (selector) => document.querySelector(selector);
const grid = $("#movieGrid");
const message = $("#message");

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`;
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function poster(path, size = "w500") {
  return path ? `${IMAGE_BASE}${size}${path}` : "";
}
async function tmdb(path, params = {}) {
  if (BACKEND_URL.includes("YOUR-VERCEL-PROJECT")) {
    throw new Error("The secure movie connection is not configured yet. Finish the Vercel setup in the project README.");
  }

  const url = new URL(BACKEND_URL);
  url.searchParams.set("path", path);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) throw new Error("The server could not authenticate with TMDB. Check the server token.");
    if (response.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
    throw new Error(data.status_message || data.error || `Movie service error (${response.status}).`);
  }
  return data;
}
function renderMovies(items, append = false) {
  if (!append) grid.replaceChildren();
  if (!items.length && !append) {
    setMessage("No films found. Try another title or change your filters.", "error");
    return;
  }
  const fragment = document.createDocumentFragment();
  items.forEach(movie => {
    const card = document.createElement("article");
    card.className = "movie-card";
    const saved = favorites.some(item => item.id === movie.id);
    const image = poster(movie.poster_path);
    const year = (movie.release_date || "").slice(0,4) || "Year unknown";
    const rating = Number(movie.vote_average || 0).toFixed(1);
    card.innerHTML = `
      <div class="poster-wrap">
        ${image ? `<img src="${image}" alt="${escapeHTML(movie.title)} poster" loading="lazy">` : `<div class="poster-placeholder">THE<br>ART OF<br>CINEMA</div>`}
        <span class="rating-badge">★ ${rating}/10</span>
        <button class="save-button ${saved ? "saved" : ""}" type="button" aria-label="Save ${escapeHTML(movie.title)}" data-save="${movie.id}">${saved ? "♥" : "♡"}</button>
      </div>
      <div class="card-meta"><span>${escapeHTML(year)}</span><span>FILM Nº ${String(movie.id).slice(-4)}</span></div>
      <h4>${escapeHTML(movie.title)}</h4><p>${escapeHTML((movie.overview || "A story waiting to be discovered.").slice(0,105))}${movie.overview?.length > 105 ? "…" : ""}</p>`;
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-save]")) return;
      showDetails(movie);
    });
    fragment.appendChild(card);
  });
  grid.appendChild(fragment);
  setMessage(`${items.length} film${items.length === 1 ? "" : "s"} loaded from TMDB. Select a poster to read more.`);
}
async function loadGenres() {
  try {
    const data = await tmdb("/genre/movie/list", {language:"en-US"});
    genres = data.genres || [];
    $("#genreFilter").innerHTML = `<option value="">All genres</option>` + genres.map(g => `<option value="${g.id}">${escapeHTML(g.name)}</option>`).join("");
  } catch (error) {
    setMessage(error.message, "error");
    throw error;
  }
}
function getFilters() {
  return {
    year: $("#yearFilter").value,
    min: Number($("#ratingFilter").value),
    genre: $("#genreFilter").value
  };
}
function applyFilters(items) {
  const f = getFilters();
  return items.filter(movie => {
    const year = (movie.release_date || "").slice(0,4);
    return (!f.year || year === f.year) &&
      Number(movie.vote_average || 0) >= f.min &&
      (!f.genre || (movie.genre_ids || []).includes(Number(f.genre)));
  });
}
async function searchMovies(query, page = 1, append = false) {
  currentQuery = query;
  currentPage = page;
  setMessage("The projectionist is finding your film…");
  try {
    let data;
    if (query) {
      data = await tmdb("/search/movie", {query, page, include_adult:false, language:"en-US"});
    } else {
      data = await tmdb("/movie/popular", {page, language:"en-US", region:"US"});
    }
    currentResults = data.results || [];
    const filtered = applyFilters(currentResults);
    renderMovies(filtered, append);
    $("#resultsTitle").textContent = query ? `Results for “${query}”` : "Popular films from the archive";
    $("#loadMore").hidden = !data.total_pages || page >= data.total_pages;
    if (!filtered.length) setMessage("No films match these filters. Try clearing a filter or another title.", "error");
  } catch (error) {
    setMessage(error.message, "error");
    grid.replaceChildren();
    $("#loadMore").hidden = true;
  }
}
async function showTrending() {
  setMessage("Finding what film lovers are watching…");
  try {
    const data = await tmdb("/trending/movie/week", {language:"en-US"});
    currentResults = data.results || [];
    renderMovies(applyFilters(currentResults));
    $("#resultsTitle").textContent = "Trending this week";
    $("#loadMore").hidden = true;
    const status = $("#connectionStatus");
    if (status) status.textContent = "Connected — the film archive is ready.";
  } catch (error) {
    setMessage(error.message, "error");
    const status = $("#connectionStatus");
    if (status) status.textContent = "Connection unavailable: " + error.message;
    throw error;
  }
}
function showDetails(movie) {
  const dialog = $("#movieDialog");
  const image = poster(movie.poster_path, "w500");
  const genreNames = (movie.genre_ids || []).map(id => genres.find(g => g.id === id)?.name).filter(Boolean);
  $("#dialogContent").innerHTML = `<div class="dialog-layout">
    ${image ? `<img src="${image}" alt="${escapeHTML(movie.title)} poster">` : `<div class="poster-placeholder">THE ART OF CINEMA</div>`}
    <div><p class="eyebrow">A FILM FROM THE ARCHIVE</p><h2>${escapeHTML(movie.title)}</h2>
    <div class="dialog-facts"><span>★ ${Number(movie.vote_average || 0).toFixed(1)} / 10</span><span>${escapeHTML((movie.release_date || "Year unknown").slice(0,4))}</span><span>${Number(movie.vote_count || 0).toLocaleString()} votes</span>${genreNames.map(g=>`<span>${escapeHTML(g)}</span>`).join("")}</div>
    <p>${escapeHTML(movie.overview || "No synopsis is available for this title yet.")}</p>
    <button class="outline-button" data-dialog-save="${movie.id}">${favorites.some(f=>f.id===movie.id) ? "SAVED TO YOUR COLLECTION ♥" : "ADD TO MY COLLECTION ♡"}</button>
    </div></div>`;
  dialog.showModal();
}
function toggleFavorite(movie) {
  const exists = favorites.some(item => item.id === movie.id);
  favorites = exists ? favorites.filter(item => item.id !== movie.id) : [...favorites, movie];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  renderFavorites();
  if (currentQuery !== null) {
    const btn = document.querySelector(`[data-save="${movie.id}"]`);
    if (btn) { btn.classList.toggle("saved", !exists); btn.textContent = exists ? "♡" : "♥"; }
  }
  return !exists;
}
function renderFavorites() {
  const holder = $("#favoritesGrid");
  holder.replaceChildren();
  if (!favorites.length) {
    const empty = document.createElement("div");
    empty.className = "empty-collection";
    empty.innerHTML = `Your collection is waiting for its first film. <span>♡</span>`;
    holder.appendChild(empty); return;
  }
  favorites.forEach(movie => {
    const card = document.createElement("article");
    card.className = "movie-card";
    card.innerHTML = `<div class="poster-wrap">${movie.poster_path ? `<img src="${poster(movie.poster_path)}" alt="${escapeHTML(movie.title)} poster" loading="lazy">` : `<div class="poster-placeholder">THE ART OF CINEMA</div>`}<button class="save-button saved" type="button" data-remove="${movie.id}" aria-label="Remove ${escapeHTML(movie.title)}">×</button></div><h4>${escapeHTML(movie.title)}</h4><p>★ ${Number(movie.vote_average || 0).toFixed(1)} / 10</p>`;
    card.addEventListener("click", e => { if (!e.target.closest("[data-remove]")) showDetails(movie); });
    holder.appendChild(card);
  });
}

async function connectArchive() {
  const status = $("#connectionStatus");
  try {
    await loadGenres();
    await showTrending();
  } catch (error) {
    if (status) status.textContent = "Connection unavailable: " + error.message;
    setMessage(error.message, "error");
  }
}

$("#searchForm").addEventListener("submit", event => {
  event.preventDefault();
  const query = $("#movieQuery").value.trim();
  if (!query) { setMessage("Please enter a film title, actor or director.", "error"); return; }
  searchMovies(query);
});
$("#movieQuery").addEventListener("keyup", event => {
  if (event.key === "Escape") { event.target.value = ""; }
});
$("#genreFilter").addEventListener("change", () => renderMovies(applyFilters(currentResults)));
$("#ratingFilter").addEventListener("change", () => renderMovies(applyFilters(currentResults)));
$("#yearFilter").addEventListener("change", () => renderMovies(applyFilters(currentResults)));
$("#clearSearch").addEventListener("click", () => {
  $("#searchForm").reset(); $("#yearFilter").value = ""; $("#ratingFilter").value = "0"; $("#genreFilter").value = "";
  renderMovies(currentResults); setMessage("Filters cleared. Your current results are back.");
});
$("#trendingButton").addEventListener("click", showTrending);
$("#loadMore").addEventListener("click", async () => {
  const old = currentResults.slice();
  await searchMovies(currentQuery, currentPage + 1, true);
  const newOnes = currentResults.filter(item => !old.some(oldItem => oldItem.id === item.id));
  renderMovies(applyFilters([...old, ...newOnes]));
});
$("#movieGrid").addEventListener("click", event => {
  const button = event.target.closest("[data-save]");
  if (!button) return;
  const movie = currentResults.find(item => item.id === Number(button.dataset.save));
  if (movie) toggleFavorite(movie);
});
$("#favoritesGrid").addEventListener("click", event => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  favorites = favorites.filter(item => item.id !== Number(button.dataset.remove));
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  renderFavorites();
});
$("#dialogContent").addEventListener("click", event => {
  const button = event.target.closest("[data-dialog-save]");
  if (!button) return;
  const movie = [...currentResults, ...favorites].find(item => item.id === Number(button.dataset.dialogSave));
  if (!movie) return;
  const saved = toggleFavorite(movie);
  button.textContent = saved ? "SAVED TO YOUR COLLECTION ♥" : "ADD TO MY COLLECTION ♡";
});
$("#closeDialog").addEventListener("click", () => $("#movieDialog").close());

async function surpriseMe() {
  const button = $("#surpriseTop");
  button.disabled = true;
  const originalLabel = button.textContent;
  button.textContent = "FINDING A SURPRISE…";
  setMessage("Searching the wider film archive for a little surprise…");

  try {
    const history = JSON.parse(localStorage.getItem(SURPRISE_HISTORY_KEY) || "[]");
    let candidates = [];

    // Search TMDB's much larger Discover catalogue, not only the films
    // currently visible in the page. Mix all genres with individual genres.
    for (let attempt = 0; attempt < 8 && !candidates.length; attempt++) {
      const useGenre = genres.length > 0 && Math.random() < 0.65;
      const selectedGenre = useGenre
        ? genres[Math.floor(Math.random() * genres.length)]
        : null;
      const params = {
        language: "en-US",
        include_adult: false,
        sort_by: Math.random() < 0.5 ? "popularity.desc" : "vote_average.desc",
        "vote_count.gte": 30,
        page: Math.floor(Math.random() * 500) + 1
      };
      if (selectedGenre) params.with_genres = selectedGenre.id;

      const data = await tmdb("/discover/movie", params);
      candidates = (data.results || []).filter(movie =>
        movie.poster_path && !history.includes(movie.id)
      );
    }

    // Fallback in the unlikely event a random Discover page is empty.
    if (!candidates.length) {
      const page = Math.floor(Math.random() * 500) + 1;
      const data = await tmdb("/movie/popular", { page, language: "en-US", region: "US" });
      candidates = (data.results || []).filter(movie => !history.includes(movie.id));
    }

    if (!candidates.length) {
      throw new Error("We couldn't find a fresh surprise right now. Please try again.");
    }

    const movie = candidates[Math.floor(Math.random() * candidates.length)];
    const updatedHistory = [movie.id, ...history.filter(id => id !== movie.id)].slice(0, 20);
    localStorage.setItem(SURPRISE_HISTORY_KEY, JSON.stringify(updatedHistory));
    showDetails(movie);
    setMessage("A fresh film from the wider TMDB archive — enjoy the surprise!");
  } catch (error) {
    setMessage(error.message || "The archive could not find a surprise. Please try again.", "error");
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}
$("#surpriseTop").addEventListener("click", surpriseMe);
$("#movieGrid").addEventListener("dblclick", event => {
  const card = event.target.closest(".movie-card");
  if (!card) return;
  const title = card.querySelector("h4")?.textContent;
  const movie = currentResults.find(item => item.title === title);
  if (movie) showDetails(movie);
});
renderFavorites();
connectArchive();
window.addEventListener("load", () => {
  setTimeout(() => $("#curtain").classList.add("open"), 350);
  setTimeout(() => $("#curtain").remove(), 2100);
});
