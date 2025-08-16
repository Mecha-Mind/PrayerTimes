/**
 * @fileoverview Module for handling API requests
 * @module api
 */

/**
 * Base URL for the Aladhan API
 * @constant {string}
 */
const API_BASE_URL = 'https://api.aladhan.com/v1';

/**
 * Fetches prayer times for the specified city
 * @async
 * @param {string} city - The city name to fetch prayer times for
 * @returns {Promise<Object>} Prayer times data
 */
export async function fetchPrayerTimes(city) {
    try {
        // First, get coordinates for the city
        const { latitude, longitude, name, country } = await geocodeCity(city);
        
        // Get prayer times using coordinates
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const prayerTimesUrl = `${API_BASE_URL}/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=5`;
        
        const response = await fetch(prayerTimesUrl);
        if (!response.ok) throw new Error('Failed to fetch prayer times');
        
        const data = await response.json();
        if (data.code !== 200) throw new Error('Invalid prayer times data');
        
        return {
            timings: data.data.timings,
            hijri: data.data.date.hijri,
            location: { name, country }
        };
    } catch (error) {
        console.error('Error in fetchPrayerTimes:', error);
        throw error;
    }
}

/**
 * Converts city name to coordinates using geocoding API
 * @async
 * @param {string} city - City name to geocode
 * @returns {Promise<Object>} Object containing latitude, longitude, name, and country
 */
async function geocodeCity(city) {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ar&format=json`;
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
        throw new Error('City not found');
    }
    
    return {
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude,
        name: data.results[0].name,
        country: data.results[0].country
    };
}
