const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchWithCache(url, cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
}

app.get('/api/user/:userId/games', async (req, res) => {
    try {
        const { userId } = req.params;
        const url = `https://games.roblox.com/v2/users/${userId}/games?sortOrder=Desc&limit=50`;
        const data = await fetchWithCache(url, `games_${userId}`);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/universe/:universeId/gamepasses', async (req, res) => {
    try {
        const { universeId } = req.params;
        const url = `https://games.roblox.com/v1/games/${universeId}/gamepasses?limit=100`;
        const data = await fetchWithCache(url, `gamepasses_${universeId}`);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/user/:userId/all-gamepasses', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?sortOrder=Desc&limit=50`;
        const gamesData = await fetchWithCache(gamesUrl, `games_${userId}`);
        
        if (!gamesData.data || gamesData.data.length === 0) {
            return res.json({ gamepasses: [] });
        }
        
        const allGamepasses = [];
        
        for (const game of gamesData.data) {
            try {
                const gamepassesUrl = `https://games.roblox.com/v1/games/${game.id}/gamepasses?limit=100`;
                const gamepassesData = await fetchWithCache(gamepassesUrl, `gamepasses_${game.id}`);
                
                if (gamepassesData.data) {
                    for (const gamepass of gamepassesData.data) {
                        allGamepasses.push({
                            id: gamepass.id,
                            name: gamepass.name,
                            description: gamepass.description || "",
                            price: gamepass.priceInRobux || 0,
                            iconUrl: `https://thumbnails.roblox.com/v1/assets?assetIds=${gamepass.id}&returnPolicy=PlaceHolder&size=150x150&format=Png`,
                            gameName: game.name,
                            universeId: game.id
                        });
                    }
                }
            } catch (err) {
                console.error(`Error fetching gamepasses for game ${game.id}:`, err.message);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        res.json({ 
            gamepasses: allGamepasses,
            totalGames: gamesData.data.length
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
