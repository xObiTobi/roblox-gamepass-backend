const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
});

// Get gamepasses using Catalog API
app.get("/gamepasses/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const response = await fetch(
            `https://catalog.roblox.com/v1/search/items?category=GamePasses&creatorType=User&creatorTargetId=${userId}&limit=50`
        );

        const data = await response.json();

        if (!data.data) {
            return res.json([]);
        }

        // Clean response format
        const gamepasses = data.data.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            imageUrl: `https://thumbnails.roblox.com/v1/assets?assetIds=${item.id}&size=420x420&format=Png`
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
