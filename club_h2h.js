// API key
const API_KEY = "a9b550c9d34eb19fbdae54f364e34427";
// Base URL for all API requests
const BASE_URL = "https://v3.football.api-sports.io/";

// Only these countries will appear in the country dropdown menus
const ALLOWED_COUNTRIES = [
  "England",
  "Spain",
  "Germany",
  "Italy",
  "France",
  "Netherlands",
  "Sweden",
  "Norway",
  "Finland",
  "Denmark",
  "Belgium",
  "Russia",
  "Ukraine",
];

//CACHING HELPERS (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

//IN-MEMORY CACHES
const countriesCache = {};
const teamsCache = {};

function saveCache(key, data) {
  const record = { timestamp: Date.now(), data };
  try {
    localStorage.setItem(key, JSON.stringify(record));
  } catch (e) {
    console.warn("localStorage save failed for", key, e);
  }
}

function loadCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const rec = JSON.parse(raw);
    if (!rec || !rec.timestamp) {
      localStorage.removeItem(key);
      return null;
    }
    if (Date.now() - rec.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return rec.data;
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
}

//API FUNCTION
async function fetchData(endpoint, params = {}) {
  const url = new URL(BASE_URL + endpoint);
  Object.keys(params).forEach((k) => url.searchParams.append(k, params[k]));

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    });

    if (!response.ok) {
      throw new Error("HTTP error! Status: " + response.status);
    }

    const json = await response.json();
    if (json.errors && Object.keys(json.errors).length > 0) {
      throw new Error("API Error: " + JSON.stringify(json.errors));
    }

    return json.response ?? json;
  } catch (err) {
    console.error("Error fetching data:", err);
    return null;
  }
}

function getTeamIdFromDatalist(inputEl, datalistId) {
  const options = Array.from(document.getElementById(datalistId).options);
  const match = options.find((opt) => opt.value === inputEl.value);
  return match ? match.getAttribute("data-id") : null;
}

//POPULATE TEAMS
function populateTeams(teams, datalistElement) {
  if (!teams || teams.length === 0) return;

  teams.sort((a, b) => {
    const aName = a.team ? a.team.name : a.teamName || "";
    const bName = b.team ? b.team.name : b.teamName || "";
    return aName.localeCompare(bName);
  });

  teams.forEach((item) => {
    const team = item.team ?? item;
    const opt = document.createElement("option");
    opt.value = team.name;
    opt.textContent = team.name;
    if (team.id) opt.setAttribute("data-id", team.id);
    datalistElement.appendChild(opt);
  });
}

//FIXTURE ROW & H2H TABLE
function FixtureRow(fixture, tbody, team1Name, team2Name) {
  const row = document.createElement("tr");
  const team1IsHome = fixture.teams.home.name === team1Name;

  const dateCell = document.createElement("td");
  dateCell.textContent = new Date(fixture.fixture.date).toLocaleDateString();

  const competitionCell = document.createElement("td");
  competitionCell.className = "competition";
  competitionCell.textContent =
    fixture.league.name + " (" + fixture.league.country + ")";

  const team1Cell = document.createElement("td");
  team1Cell.textContent = team1Name;

  const scoreCell = document.createElement("td");
  scoreCell.className = "score";
  const t1Score = team1IsHome ? fixture.goals.home : fixture.goals.away;
  const t2Score = team1IsHome ? fixture.goals.away : fixture.goals.home;
  scoreCell.textContent = (t1Score ?? 0) + " - " + (t2Score ?? 0);

  const team2Cell = document.createElement("td");
  team2Cell.textContent = team2Name;

  row.append(dateCell, competitionCell, team1Cell, scoreCell, team2Cell);
  tbody.appendChild(row);
}

function H2H(fixtures, team1Name, team2Name) {
  const container = document.getElementById("results-container");
  container.innerHTML = "";

  if (!fixtures || fixtures.length === 0) {
    console.log(
      "No historical matches found between " + team1Name + " and " + team2Name
    );
    return;
  }

  fixtures.sort(
    (a, b) =>
      new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
  );

  const T1 = team1Name;
  const T2 = team2Name;

  let stats = {
    T1_W: 0,
    T2_W: 0,
    D: 0,
    T1_G: 0,
    T2_G: 0,
    TotalMatches: fixtures.length,
  };

  fixtures.forEach((fixture) => {
    const homeScore = fixture.goals.home ?? 0;
    const awayScore = fixture.goals.away ?? 0;

    if (fixture.teams.home.name === T1) {
      stats.T1_G += homeScore;
      stats.T2_G += awayScore;
      if (homeScore > awayScore) stats.T1_W++;
      else if (awayScore > homeScore) stats.T2_W++;
      else stats.D++;
    } else if (fixture.teams.home.name === T2) {
      stats.T2_G += homeScore;
      stats.T1_G += awayScore;
      if (homeScore > awayScore) stats.T2_W++;
      else if (awayScore > homeScore) stats.T1_W++;
      else stats.D++;
    } else {
      const t1Score = fixture.teams.home.name === T1 ? homeScore : awayScore;
      const t2Score = fixture.teams.home.name === T2 ? homeScore : awayScore;
      stats.T1_G += t1Score;
      stats.T2_G += t2Score;
      if (t1Score > t2Score) stats.T1_W++;
      else if (t2Score > t1Score) stats.T2_W++;
      else stats.D++;
    }
  });

  const summaryHTML =
    "<h3>Head-2-Head: " +
    T1 +
    " vs " +
    T2 +
    "</h3>" +
    "<p><strong>" +
    T1 +
    " Wins:</strong> " +
    stats.T1_W +
    " | <strong>" +
    T2 +
    " Wins:</strong> " +
    stats.T2_W +
    " | <strong>Draws:</strong> " +
    stats.D +
    "</p>" +
    "<p>Total Matches: " +
    stats.TotalMatches +
    " | " +
    T1 +
    " Goals: " +
    stats.T1_G +
    " | " +
    T2 +
    " Goals: " +
    stats.T2_G +
    "</p>" +
    "<hr>" +
    "<h4>Match History (" +
    stats.TotalMatches +
    " Matches Total)</h4>";

  container.insertAdjacentHTML("beforeend", summaryHTML);

  const table = document.createElement("table");
  table.className = "h2h-results-table";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const headers = ["Date", "Competition", T1, "Score", T2];
  headers.forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  fixtures.forEach((fixture) => FixtureRow(fixture, tbody, T1, T2));
  table.appendChild(tbody);
  container.appendChild(table);

  console.log("Displaying H2H data for " + team1Name + " vs " + team2Name);
}

//VALIDATION & UI
function checkSelectionComplete() {
  const team1Input = document.getElementById("team1");
  const team2Input = document.getElementById("team2");
  const searchBtn = document.getElementById("h2h-search-btn");

  if (!team1Input || !team2Input || !searchBtn) return;

  const isValidSelection = (inputEl, datalistId) => {
    const options = Array.from(document.getElementById(datalistId).options);
    return inputEl.value && options.some((o) => o.value === inputEl.value);
  };

  const team1Selected = isValidSelection(team1Input, "team-options-1");
  const team2Selected = isValidSelection(team2Input, "team-options-2");

  searchBtn.disabled = !(team1Selected && team2Selected);
}

//HANDLERS
async function init() {
  const countrySelect1 = document.getElementById("country1");
  const countrySelect2 = document.getElementById("country2");

  if (!countrySelect1 || !countrySelect2) {
    console.warn("Expected DOM elements not found during init.");
    return;
  }

  console.log("Loading allowed countries...");

  let countries = loadCache("countries_list");

  if (!countries) {
    countries = await fetchData("countries");
    if (countries) saveCache("countries_list", countries);
  }

  if (countries) {
    const filtered = countries.filter((c) =>
      ALLOWED_COUNTRIES.includes(c.name)
    );
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    filtered.forEach((country) => {
      countriesCache[country.name] = country.code || country.name;
      countrySelect1.add(new Option(country.name, country.name));
      countrySelect2.add(new Option(country.name, country.name));
    });

    console.log("Countries loaded successfully");
  } else {
    console.error("Could not load countries. Check API key and connection.");
  }
}

async function handleCountryChange(teamIndex) {
  const countrySelect = document.getElementById("country" + teamIndex);
  const teamDatalist = document.getElementById("team-options-" + teamIndex);
  const teamInput = document.getElementById("team" + teamIndex);
  const countryName = countrySelect.value;

  if (!teamDatalist || !teamInput) return;

  teamDatalist.innerHTML = "";
  teamInput.value = "";
  if (!countryName) {
    teamInput.disabled = true;
    checkSelectionComplete();
    return;
  }

  teamInput.disabled = true;
  console.log("Loading teams for " + countryName + "...");

  if (teamsCache[countryName]) {
    populateTeams(teamsCache[countryName], teamDatalist);
    console.log("Teams loaded for " + countryName + " (memory cache)");
    teamInput.disabled = false;
    checkSelectionComplete();
    return;
  }

  const stored = loadCache("teams_" + countryName);
  if (stored) {
    teamsCache[countryName] = stored;
    populateTeams(stored, teamDatalist);
    console.log("Teams loaded for " + countryName + " (local cache)");
    teamInput.disabled = false;
    checkSelectionComplete();
    return;
  }

  const teams = await fetchData("teams", { country: countryName });
  if (teams) {
    teamsCache[countryName] = teams;
    saveCache("teams_" + countryName, teams);
    populateTeams(teams, teamDatalist);
    console.log("Teams loaded for " + countryName + " (API)");
  } else {
    console.error(
      "No teams found for " + countryName + " or an error occurred"
    );
  }

  teamInput.disabled = false;
  checkSelectionComplete();
}

async function searchH2H() {
  const team1Input = document.getElementById("team1");
  const team2Input = document.getElementById("team2");
  const resultsContainer = document.getElementById("results-container");

  if (!team1Input || !team2Input || !resultsContainer) return;

  const team1Id = getTeamIdFromDatalist(team1Input, "team-options-1");
  const team2Id = getTeamIdFromDatalist(team2Input, "team-options-2");
  const team1Name = team1Input.value;
  const team2Name = team2Input.value;

  if (!team1Id || !team2Id) {
    console.error("Please select valid teams from the dropdowns");
    return;
  }

  console.log("Fetching H2H for " + team1Name + " vs " + team2Name + "...");
  resultsContainer.innerHTML = "";

  const h2hKey = "h2h_" + team1Id + "_" + team2Id;

  let h2hData = loadCache(h2hKey);
  if (!h2hData) {
    h2hData = await fetchData("fixtures/headtohead", {
      h2h: team1Id + "-" + team2Id,
    });
    if (h2hData) saveCache(h2hKey, h2hData);
  }

  if (h2hData) {
    H2H(h2hData, team1Name, team2Name);
  } else {
    console.error("No Head-2-Head data found or an error occurred");
  }
}

function clearFields() {
  const resetTeam = (num) => {
    const country = document.getElementById("country" + num);
    const team = document.getElementById("team" + num);
    const list = document.getElementById("team-options-" + num);
    if (country) country.value = "";
    if (team) {
      team.value = "";
      team.disabled = true;
    }
    if (list) list.innerHTML = "";
  };

  resetTeam(1);
  resetTeam(2);

  const searchBtn = document.getElementById("h2h-search-btn");
  if (searchBtn) searchBtn.disabled = true;
  const resultsContainer = document.getElementById("results-container");
  if (resultsContainer) resultsContainer.innerHTML = "";

  console.log("Fields cleared");
}

//DOM LISTENERS
document.addEventListener("input", (event) => {
  if (
    event.target &&
    (event.target.id === "team1" || event.target.id === "team2")
  ) {
    checkSelectionComplete();
  }
});

init();
