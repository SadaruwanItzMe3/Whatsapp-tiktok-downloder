// tiktok.js

const axios = require('axios');
const { tikTokApi } = require('./config');

// Download TikTok video by URL
async function downloadTikTok(url) {
    try {
        const response = await axios.get(`${tikTokApi}/api?url=${encodeURIComponent(url)}`);
        if (response.data && response.data.data && response.data.data.play) {
            return response.data.data.play; // Direct MP4 URL
        } else {
            throw new Error('Failed to get video URL');
        }
    } catch (error) {
        console.error(error);
        throw new Error('Error downloading TikTok video');
    }
}

// Get 5 random trending TikTok videos
async function getRandomTikToks(count = 5) {
    try {
        const response = await axios.get(`${tikTokApi}/api/trending?count=${count}`);
        if (response.data && response.data.data) {
            return response.data.data.map(item => item.play);
        } else {
            throw new Error('Failed to fetch trending TikToks');
        }
    } catch (error) {
        console.error(error);
        throw new Error('Error fetching trending TikToks');
    }
}

module.exports = { downloadTikTok, getRandomTikToks };
