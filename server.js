const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Health route
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
});

// Gamepasses route
app.get("/gamepasses/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const response = await fetch(
            `https://catalog.roblox.com/v1/search/items?creatorType=User&creatorTargetId=${userId}&assetTypes=34&limit=100`
        );

        const data = await response.json();

        if (!data.data) {
            return res.json([]);
        }

        const gamepasses = data.data.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price
        }));

        res.json(gamepasses);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch gamepasses" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
