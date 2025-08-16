/**
 * @fileoverview Prayer Times Application
 * @version 1.0.0
 * @license MIT
 */

/**
 * Base URL for the Aladhan API
 * @constant {string}
 */
const API_BASE_URL = 'https://api.aladhan.com/v1';

// ============================================
// DOM Elements
// ============================================

const cityInput = document.getElementById('cityInput');

const searchBtn = document.getElementById('searchBtn');
const currentDateElement = document.getElementById('currentDate');

const hijriDateElement = document.getElementById('hijriDate');

const currentLocationElement = document.getElementById('currentLocation');

const nextPrayerNameElement = document.getElementById('nextPrayerName');

const nextPrayerName2Element = document.getElementById('nextPrayerName2');

const countdownElement = document.getElementById('countdown');

/** @type {HTMLButtonElement} */
const toggleAudioBtn = document.getElementById('toggleAudio');

/** @type {HTMLAudioElement} */
const athanAudio = document.getElementById('athanAudio');

// ============================================
// Notification Elements
// ============================================

/** @type {HTMLElement} */
const notificationPopup = document.getElementById('notificationPopup');

/** @type {HTMLElement} */
const notificationMessage = document.getElementById('notificationMessage');

/** @type {HTMLButtonElement} */
const closeNotificationBtn = document.getElementById('closeNotification');

/** @type {HTMLButtonElement} */
const notificationActionBtn = document.getElementById('notificationAction');

/** @type {HTMLAnchorElement} */
const reportBugBtn = document.getElementById('reportBug');

// ============================================
// Prayer Time Elements
// ============================================

/** @type {Object.<string, HTMLElement>} */
const prayerTimeElements = {
    fajr: document.querySelector('#fajr .time'),
    sunrise: document.querySelector('#sunrise .time'),
    dhuhr: document.querySelector('#dhuhr .time'),
    asr: document.querySelector('#asr .time'),
    maghrib: document.querySelector('#maghrib .time'),
    isha: document.querySelector('#isha .time')
};

// ============================================
// Application State
// ============================================

/** @type {Object.<string, string>} Stores prayer times in 12-hour format */
let prayerTimes = {};

/** @type {Object|null} Information about the next prayer */
let nextPrayer = null;

/** @type {number|null} Interval ID for the countdown timer */
let countdownInterval = null;

/** @type {boolean} Audio notification preference */
let isAudioEnabled = false;

/** @type {string} Default city in 'City,Country' format */
let currentCity = 'Cairo,EG';

/**
 * Displays a notification popup with the given message and type
 * @param {string} message - The message to display
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - The type of notification
 * @returns {void}
 */
function showNotification(message, type = 'info') {
    notificationMessage.textContent = message;
    const icon = notificationPopup.querySelector('.notification-icon i');
    
    // Set icon and color based on notification type
    switch(type) {
        case 'error':
            icon.className = 'fas fa-exclamation-circle';
            icon.style.color = '#ff4444';
            break;
        case 'success':
            icon.className = 'fas fa-check-circle';
            icon.style.color = '#4CAF50';
            break;
        case 'warning':
            icon.className = 'fas fa-exclamation-triangle';
            icon.style.color = '#FFC107';
            break;
        default:
            icon.className = 'fas fa-info-circle';
            icon.style.color = '#2196F3';
    }
    
    // Show the popup with animation
    notificationPopup.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

/**
 * Hides the currently displayed notification
 * @returns {void}
 */
function hideNotification() {
    notificationPopup.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Initializes the application
 * - Sets up event listeners
 * - Loads saved preferences
 * - Fetches initial prayer times
 * @async
 * @returns {Promise<void>}
 */
async function init() {
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update time every minute
    
    // Set up event listeners
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    toggleAudioBtn.addEventListener('click', toggleAudio);
    
    // Notification events
    closeNotificationBtn.addEventListener('click', hideNotification);
    notificationActionBtn.addEventListener('click', hideNotification);
    
    // Report bug button
    reportBugBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://my-nextjs-portfolio-sigma.vercel.app/contact', '_blank');
    });
    
    // Close notification when clicking outside
    notificationPopup.addEventListener('click', (e) => {
        if (e.target === notificationPopup) {
            hideNotification();
        }
    });
    
    // Load saved preferences
    loadPreferences();
    
    try {
        // Fetch prayer times for default city
        await fetchPrayerTimes(currentCity);
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('حدث خطأ أثناء تحميل بيانات الصلاة', 'error');
    }
}

/**
 * Updates the current date and time display
 * Also triggers next prayer update
 * @returns {void}
 */
function updateDateTime() {
    const now = new Date();
    
    // Update Gregorian date
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDateElement.textContent = now.toLocaleDateString('ar-EG', options);
    
    // Update time-based elements
    updateNextPrayer();
}

/**
 * Fetches prayer times for the specified city
 * @async
 * @param {string} city - The city name to fetch prayer times for
 * @returns {Promise<void>}
 * @throws {Error} If there's an error fetching or processing the data
 */
async function fetchPrayerTimes(city) {
    try {
        // Show loading state
        currentLocationElement.textContent = 'جاري التحميل...';
        
        // First, get coordinates for the city
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ar&format=json`;
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();
        
        if (!geocodeData.results || geocodeData.results.length === 0) {
            showNotification('المدينة غير موجودة. الرجاء المحاولة مرة أخرى.', 'error');
            currentLocationElement.textContent = 'اختر مدينة';
            return;
        }
        
        const { latitude, longitude, name, country } = geocodeData.results[0];
        currentCity = `${name},${country}`;
        currentLocationElement.textContent = `${name}, ${country}`;
        
        // Save the current city to localStorage
        savePreferences();
        
        // Get prayer times using coordinates
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const prayerTimesUrl = `${API_BASE_URL}/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=5`;
        
        const prayerResponse = await fetch(prayerTimesUrl);
        const prayerData = await prayerResponse.json();
        
        if (prayerData.code === 200) {
            const timings = prayerData.data.timings;
            
            // Update prayer times in the UI
            updatePrayerTimes(timings);
            
            // Update Hijri date
            const hijri = prayerData.data.date.hijri;
            hijriDateElement.textContent = `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;
            
            // Update next prayer and start countdown
            updateNextPrayer();
            startCountdown();
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        alert('حدث خطأ أثناء جلب مواقيت الصلاة. الرجاء المحاولة مرة أخرى لاحقًا.');
    }
}

/**
 * Updates the prayer times in the UI
 * @param {Object.<string, string>} timings - Prayer timings from the API
 * @returns {void}
 */
function updatePrayerTimes(timings) {
    prayerTimes = {
        fajr: formatTime(timings.Fajr),
        sunrise: formatTime(timings.Sunrise),
        dhuhr: formatTime(timings.Dhuhr),
        asr: formatTime(timings.Asr),
        maghrib: formatTime(timings.Maghrib),
        isha: formatTime(timings.Isha)
    };
    
    // Update the UI
    for (const [prayer, time] of Object.entries(prayerTimes)) {
        if (prayerTimeElements[prayer]) {
            prayerTimeElements[prayer].textContent = time;
        }
    }
}

/**
 * Converts 24-hour time to 12-hour format with AM/PM in Arabic
 * @param {string} time24 - Time in 24-hour format (HH:MM)
 * @returns {string} Formatted time in 12-hour format with ص/م
 */
function formatTime(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Updates the next prayer information and highlights the current prayer
 * @returns {Object|null} Information about the next prayer or null if not found
 */
function updateNextPrayer() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Reset all active states
    document.querySelectorAll('.prayer-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Find the next prayer
    const prayerOrder = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let nextPrayerName = null;
    
    for (const prayer of prayerOrder) {
        if (!prayerTimes[prayer]) continue;
        
        const [time, period] = prayerTimes[prayer].split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format for comparison
        if (period === 'م' && hours < 12) hours += 12;
        if (period === 'ص' && hours === 12) hours = 0;
        
        const prayerTimeInMinutes = hours * 60 + minutes;
        
        if (prayerTimeInMinutes > currentTime) {
            nextPrayerName = prayer;
            break;
        }
    }
    
    // If no next prayer found, default to Fajr tomorrow
    if (!nextPrayerName) {
        nextPrayerName = 'fajr';
    }
    
    // Highlight the current prayer
    const currentPrayerIndex = prayerOrder.indexOf(nextPrayerName);
    const currentPrayerName = currentPrayerIndex === 0 ? 'isha' : prayerOrder[currentPrayerIndex - 1];
    
    const currentPrayerElement = document.getElementById(currentPrayerName);
    if (currentPrayerElement) {
        currentPrayerElement.classList.add('active');
    }
    
            // Update next prayer display
    nextPrayer = {
        name: nextPrayerName,
        displayName: getPrayerArabicName(nextPrayerName)
    };
    
    // Update the display elements
    const displayName = nextPrayer.displayName;
    nextPrayerNameElement.textContent = displayName;
    nextPrayerName2Element.textContent = displayName;
    
    // Show loading state
    countdownElement.textContent = 'جاري التحديث...';
    
    // Update countdown after a small delay to prevent recursion
    setTimeout(updateCountdown, 100);
    
    return nextPrayer;
}

/**
 * Gets the Arabic name for a prayer
 * @param {string} prayer - Prayer identifier (e.g., 'fajr', 'dhuhr')
 * @returns {string} Arabic name of the prayer
 */
function getPrayerArabicName(prayer) {
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

/**
 * Formats time remaining in HH:MM:SS format
 * @param {number} seconds - Total seconds remaining
 * @returns {string} Formatted time string (HH:MM:SS)
 */
function formatTimeRemaining(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Updates the countdown display for the next prayer
 * @returns {boolean} True if update was successful, false otherwise
 */
function updateCountdown() {
    try {
        const now = new Date();
        const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        
        if (!nextPrayer || !prayerTimes || !prayerTimes[nextPrayer?.name]) {
            countdownElement.textContent = '--:--:--';
            return false; // Return false to indicate no update was made
        }
        
        const prayerTimeStr = prayerTimes[nextPrayer.name];
        if (!prayerTimeStr) {
            console.error('Invalid prayer time format');
            return false;
        }
        
        // Get next prayer time in seconds since midnight
        const [time, period] = prayerTimeStr.split(' ');
        const [hoursStr, minutesStr] = time.split(':');
        
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        
        if (isNaN(hours) || isNaN(minutes)) {
            console.error('Invalid time format:', time);
            return false;
        }
        
        // Convert to 24-hour format for comparison
        if (period === 'م' && hours < 12) hours += 12;
        if (period === 'ص' && hours === 12) hours = 0;
        
        const prayerTimeInSeconds = hours * 3600 + minutes * 60;
        
        // Calculate time remaining
        let timeRemaining = prayerTimeInSeconds - currentTime;
        
        // Handle case when prayer time is for the next day
        if (timeRemaining < 0) {
            timeRemaining += 24 * 3600; // Add 24 hours
        }
        
        // Update countdown display
        countdownElement.textContent = formatTimeRemaining(timeRemaining);
        
        // Check if it's time for prayer (within 1 minute)
        if (timeRemaining <= 60 && timeRemaining > 0 && isAudioEnabled) {
            playAthan();
        }
        
        return true; // Successfully updated
    } catch (error) {
        console.error('Error in updateCountdown:', error);
        countdownElement.textContent = '--:--:--';
        return false;
    }
}

/**
 * Starts the countdown timer for the next prayer
 * Clears any existing interval before starting a new one
 * @returns {void}
 */
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    // Update immediately
    updateCountdown();
    
    // Then update every second
    countdownInterval = setInterval(updateCountdown, 1000);
}

/**
 * Plays the Athan audio if audio is enabled
 * Handles any playback errors silently
 * @returns {void}
 */
function playAthan() {
    if (isAudioEnabled) {
        athanAudio.currentTime = 0;
        athanAudio.play().catch(error => {
            console.error('Error playing athan:', error);
        });
    }
}

/**
 * Toggles audio notifications on/off
 * Updates the UI and saves the preference
 * @returns {void}
 */
function toggleAudio() {
    isAudioEnabled = !isAudioEnabled;
    
    if (isAudioEnabled) {
        toggleAudioBtn.innerHTML = '<i class="fas fa-volume-up"></i> إيقاف التنبيه الصوتي';
        toggleAudioBtn.classList.remove('muted');
    } else {
        toggleAudioBtn.innerHTML = '<i class="fas fa-volume-mute"></i> تفعيل التنبيه الصوتي';
        toggleAudioBtn.classList.add('muted');
    }
    
    savePreferences();
}

/**
 * Handles the city search form submission
 * Validates input and triggers prayer time fetch
 * @returns {void}
 */
function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        // Show loading state
        countdownElement.textContent = 'جاري البحث...';
        nextPrayerNameElement.textContent = '...';
        nextPrayerName2Element.textContent = '...';
        
        // Clear any existing prayer times
        Object.values(prayerTimeElements).forEach(el => {
            if (el) el.textContent = '--:--';
        });
        
        fetchPrayerTimes(city).catch(error => {
            console.error('Error in handleSearch:', error);
            countdownElement.textContent = '--:--:--';
            showNotification('حدث خطأ أثناء البحث. الرجاء التأكد من اسم المدينة والمحاولة مرة أخرى.', 'error');
        });
    } else {
        showNotification('الرجاء إدخال اسم المدينة', 'warning');
        cityInput.focus();
    }
}

/**
 * Saves user preferences to localStorage
 * Currently saves: audioEnabled, currentCity
 * @returns {void}
 */
function savePreferences() {
    const preferences = {
        city: currentCity,
        isAudioEnabled: isAudioEnabled
    };
    
    localStorage.setItem('prayerTimesPreferences', JSON.stringify(preferences));
}

/**
 * Loads user preferences from localStorage
 * Applies any saved settings to the application
 * @returns {void}
 */
function loadPreferences() {
    const savedPreferences = localStorage.getItem('prayerTimesPreferences');
    
    if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        currentCity = preferences.city;
        isAudioEnabled = preferences.isAudioEnabled;
        
        // Update UI based on preferences
        if (isAudioEnabled) {
            toggleAudioBtn.innerHTML = '<i class="fas fa-volume-up"></i> إيقاف التنبيه الصوتي';
            toggleAudioBtn.classList.remove('muted');
        } else {
            toggleAudioBtn.innerHTML = '<i class="fas fa-volume-mute"></i> تفعيل التنبيه الصوتي';
            toggleAudioBtn.classList.add('muted');
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
