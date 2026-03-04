// server.js (dynamic per-player)
const express = require("express");
const fetch = require("node-fetch"); // Node <18
const app = express();
const PORT = process.env.PORT || 3000;
const MAX_GAMES = 50;
const MAX_GAMEPASSES = 100;

app.use(express.json());

// Fetch public games
async function getPublicGames(userId) {
  const url = `https://games.roblox.com/v1/users/${userId}/games?accessFilter=Public&limit=${MAX_GAMES}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch public games: ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

// Fetch gamepasses per universe
async function getGamepassesForUniverse(universeId) {
  const url = `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=${MAX_GAMEPASSES}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch gamepasses: ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

// Fetch all gamepasses for given userId
async function getAllGamepasses(userId) {
  const games = await getPublicGames(userId);
  const allGamepasses = [];

  for (const game of games) {
    const universeId = game.id || game.universeId;
    if (!universeId) continue;

    try {
      const gamepasses = await getGamepassesForUniverse(universeId);
      gamepasses.forEach(gp => {
        allGamepasses.push({
          id: gp.id,
          name: gp.name,
          price: gp.price || 0,
          iconUrl: gp.iconUrl,
          universeId: universeId
        });
      });
    } catch (err) {
      console.warn(`Failed for universe ${universeId}: ${err.message}`);
    }
  }

  return allGamepasses;
}

// Dynamic endpoint for any player
// Example: /gamepasses?userId=12345678
app.get("/gamepasses", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ success: false, message: "Missing userId query parameter" });

  try {
    const gamepasses = await getAllGamepasses(userId);
    res.json({ success: true, gamepasses });
  } catch (err) {
    console.error("Error fetching gamepasses:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`RoDonate Gamepasses API running on port ${PORT}`);
});
