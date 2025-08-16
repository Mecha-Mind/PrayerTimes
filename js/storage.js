/**
 * @fileoverview Module for handling local storage operations
 * @module storage
 */

/**
 * Saves user preferences to localStorage
 * @param {string} city - Current city
 * @param {boolean} audioEnabled - Audio notification preference
 * @returns {void}
 */
export function savePreferences(city, audioEnabled) {
    const preferences = { city, audioEnabled };
    localStorage.setItem('prayerTimesPreferences', JSON.stringify(preferences));
}

/**
 * Loads user preferences from localStorage
 * @returns {Object} User preferences {city: string, audioEnabled: boolean}
 */
export function loadPreferences() {
    const defaultPrefs = {
        city: 'Cairo,EG',
        audioEnabled: false
    };

    try {
        const saved = localStorage.getItem('prayerTimesPreferences');
        if (!saved) return defaultPrefs;
        
        const parsed = JSON.parse(saved);
        return {
            city: parsed.city || defaultPrefs.city,
            audioEnabled: parsed.audioEnabled !== undefined 
                ? parsed.audioEnabled 
                : defaultPrefs.audioEnabled
        };
    } catch (error) {
        console.error('Error loading preferences:', error);
        return defaultPrefs;
    }
}
