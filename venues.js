// Base URL for all API requests
const BASE_URL = "https://v3.football.api-sports.io";

// API Key
const API_KEY = {
  "x-apisports-key": "a9b550c9d34eb19fbdae54f364e34427",
};

// Object containing functions that build API endpoint URLs
const ENDPOINTS = {
  teamsByLeague: (leagueId, seasonYear) =>
    BASE_URL + "/teams?league=" + leagueId + "&season=" + seasonYear,
};

// Using 2023 as the season year for completed season data
const SEASON_YEAR = 2023;

// Fixed list of Major European Leagues
const LEAGUES = [
  { id: 39, name: "Premier League" },
  { id: 78, name: "Bundesliga" },
  { id: 140, name: "La Liga" },
  { id: 61, name: "Ligue 1" },
  { id: 135, name: "Serie A" },
];

// Stores teams data to avoid re-fetching
let teamsCache = {};

// Store references to HTML elements for easy access
const leagueSelect = document.getElementById("league-select");
const teamSelect = document.getElementById("team-select");
const venueContainer = document.getElementById("venue-details-container");

// API call function using async, await
async function fetchData(endpoint) {
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: API_KEY,
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        throw new Error(
          "Access Error: Status " +
            response.status +
            ". Check your API key or daily limits."
        );
      }
      throw new Error("HTTP error! Status: " + response.status);
    }

    const data = await response.json();

    if (data.errors && data.errors["x-apisports-key"]) {
      throw new Error(
        "API Key Error: " +
          data.errors["x-apisports-key"] +
          ". Please check your key."
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

// Fills a select element with options from an array of objects
function populateDropdown(selectElement, options, valueKey, textKey) {
  const dropdownType = selectElement.id.includes("league") ? "League" : "Team";
  selectElement.innerHTML =
    "<option value=''>Select a " + dropdownType + "</option>";

  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option[valueKey];
    opt.textContent = option[textKey];
    selectElement.appendChild(opt);
  });
}

// Displays the stadium information for a selected team
function Venue(venue) {
  if (!venue || !venue.venueName) {
    console.log("Venue details not found for this team");
    return;
  }

  const imageUrl =
    venue.venueImage ||
    "https://via.placeholder.com/600x400?text=No+Stadium+Image";
  const capacityText = venue.venueCapacity
    ? venue.venueCapacity.toLocaleString()
    : "N/A";
  const cityText = venue.venueCity || "N/A";

  const venueHTML =
    '<img src="' +
    imageUrl +
    '" alt="' +
    venue.venueName +
    ' Stadium">' +
    "<h2>" +
    venue.venueName +
    "</h2>" +
    "<p><strong>Team:</strong> " +
    venue.teamName +
    "</p>" +
    "<p><strong>City:</strong> " +
    cityText +
    "</p>" +
    "<p><strong>Capacity:</strong> " +
    capacityText +
    "</p>";

  venueContainer.innerHTML = venueHTML;
  console.log("Displaying venue: " + venue.venueName);
}

// Called when user selects a league from the dropdown
async function handleLeagueChange() {
  const leagueId = leagueSelect.value;
  const localStorageKey = "teams_" + leagueId + "_" + SEASON_YEAR;

  teamSelect.disabled = true;
  teamSelect.innerHTML = "<option value=''>Select a Team</option>";
  venueContainer.innerHTML = "";

  if (!leagueId) return;

  console.log("Loading teams for league " + leagueId + "...");

  const storedData = localStorage.getItem(localStorageKey);
  let teams;

  if (storedData) {
    console.log(
      "Cache hit: Using data from localStorage for League " + leagueId
    );
    try {
      teams = JSON.parse(storedData);
    } catch (e) {
      console.error("Error parsing stored JSON:", e);
      localStorage.removeItem(localStorageKey);
    }
  }

  if (!teams) {
    console.log("Cache miss: Fetching data from API for League " + leagueId);
    const endpoint = ENDPOINTS.teamsByLeague(leagueId, SEASON_YEAR);
    const teamsData = await fetchData(endpoint);

    if (teamsData && teamsData.response && teamsData.response.length > 0) {
      teams = teamsData.response.map((team) => ({
        teamName: team.team.name,
        venueName: team.venue.name,
        venueCity: team.venue.city,
        venueCapacity: team.venue.capacity,
        venueImage: team.venue.image,
      }));

      try {
        localStorage.setItem(localStorageKey, JSON.stringify(teams));
        console.log("Data successfully saved to localStorage");
      } catch (e) {
        console.warn("Could not save to localStorage (storage full?):", e);
      }
    }
  }

  if (teams && teams.length > 0) {
    teamsCache[leagueId] = teams;
    populateDropdown(teamSelect, teams, "teamName", "teamName");
    teamSelect.disabled = false;
    console.log("Teams loaded for league " + leagueId);
  } else if (!storedData) {
    console.error(
      "No teams found for this league/season, or an API error occurred"
    );
  }
}

// Called when user selects a team from the dropdown
function handleTeamChange() {
  const selectedTeamName = teamSelect.value;
  const leagueId = leagueSelect.value;

  if (!selectedTeamName || !leagueId) {
    return;
  }

  const selectedTeam = teamsCache[leagueId].find(
    (team) => team.teamName === selectedTeamName
  );

  if (selectedTeam) {
    const venueDetails = {
      teamName: selectedTeam.teamName,
      venueName: selectedTeam.venueName,
      venueCity: selectedTeam.venueCity,
      venueCapacity: selectedTeam.venueCapacity,
      venueImage: selectedTeam.venueImage,
    };
    Venue(venueDetails);
  } else {
    console.error("Error: Team data not found in cache");
  }
}

// Sets up the page when it first loads
function init() {
  populateDropdown(leagueSelect, LEAGUES, "id", "name");
  leagueSelect.addEventListener("change", handleLeagueChange);
  teamSelect.addEventListener("change", handleTeamChange);
  console.log("Venues page initialized");
}

init();
