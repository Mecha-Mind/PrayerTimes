/**
 * @fileoverview Utility functions
 * @module utils
 */

/**
 * Converts 24-hour time to 12-hour format with AM/PM in Arabic
 * @param {string} time24 - Time in 24-hour format (HH:MM)
 * @returns {string} Formatted time in 12-hour format with ص/م
 */
export function formatTime(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Formats time remaining in HH:MM:SS format
 * @param {number} seconds - Total seconds remaining
 * @returns {string} Formatted time string (HH:MM:SS)
 */
export function formatTimeRemaining(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
    ].join(':');
}

/**
 * Gets the Arabic name for a prayer
 * @param {string} prayer - Prayer identifier (e.g., 'fajr', 'dhuhr')
 * @returns {string} Arabic name of the prayer
 */
export function getPrayerArabicName(prayer) {
    const prayerNames = {
        fajr: 'الفجر',
        sunrise: 'الشروق',
        dhuhr: 'الظهر',
        asr: 'العصر',
        maghrib: 'المغرب',
        isha: 'العشاء'
    };
    return prayerNames[prayer] || prayer;
}
