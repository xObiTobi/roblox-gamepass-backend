const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/gamepasses/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const response = await fetch(
            `https://games.roblox.com/v2/users/${userId}/games?sortOrder=Asc&limit=50`
        );

        const data = await response.json();

        let allGamepasses = [];

        for (const game of data.data) {
            const passResponse = await fetch(
                `https://games.roblox.com/v1/games/${game.id}/game-passes?limit=100&sortOrder=Asc`
            );

            const passData = await passResponse.json();

            if (passData.data) {
                allGamepasses.push(...passData.data);
            }
        }

        res.json(allGamepasses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch gamepasses" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
