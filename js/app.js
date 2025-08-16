/**
 * @fileoverview Main application entry point
 * @module app
 */

import { fetchPrayerTimes } from './api.js';
import { 
    setupEventListeners, 
    updatePrayerTimes, 
    updateNextPrayer, 
    updateDateTime, 
    updateLocation, 
    showNotification,
    updateAudioButton,
    playAthan,
    setLoading
} from './ui.js';
import { loadPreferences, savePreferences } from './storage.js';

// Application state
let isAudioEnabled = false;
let currentCity = '';
let updateDateTimeInterval = null;

/**
 * Initializes the application
 * @async
 * @returns {Promise<void>}
 */
async function init() {
    try {
        // Load saved preferences
        const prefs = loadPreferences();
        currentCity = prefs.city;
        isAudioEnabled = prefs.audioEnabled;
        
        // Update UI with preferences
        updateAudioButton(isAudioEnabled);
        
        // Set up event listeners
        setupEventListeners(handleSearch, toggleAudio);
        
        // Start date/time updates
        updateDateTime();
        updateDateTimeInterval = setInterval(updateDateTime, 60000);
        
        // Load initial prayer times if we have a city
        if (currentCity) {
            await handleSearch(true); // true means this is initial load
            
            // Show welcome message after loading prayer times
            setTimeout(() => {
                showNotification(
                    'مرحباً بك في تطبيق مواقيت الصلاة\nيمكنك البحث عن أي مدينة في العالم',
                    'info',
                    {
                        title: 'أهلاً وسهلاً',
                        confirmText: 'حسناً، شكراً'
                    }
                );
            }, 500);
        } else {
            // Default to Cairo if no city is set
            currentCity = 'Cairo,EG';
            await handleSearch(true); // true means this is initial load
            
            // Show welcome message after loading prayer times
            setTimeout(() => {
                showNotification(
                    'مرحباً بك في تطبيق مواقيت الصلاة\nيمكنك البحث عن أي مدينة في العالم',
                    'info',
                    {
                        title: 'أهلاً وسهلاً',
                        confirmText: 'حسناً، شكراً'
                    }
                );
            }, 500);
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification(
            'حدث خطأ أثناء تحميل التطبيق. يرجى تحديث الصفحة والمحاولة مرة أخرى.',
            'error',
            {
                title: 'خطأ في التحميل',
                confirmText: 'حسناً'
            }
        );
    }
}

/**
 * Handles the city search
 * @async
 * @returns {Promise<void>}
 */
/**
 * Handles the search functionality
 * @param {boolean} [isInitialLoad=false] - Whether this is the initial load of the app
 * @returns {Promise<void>}
 */
async function handleSearch(isInitialLoad = false) {
    const cityInput = document.getElementById('cityInput');
    const searchText = cityInput.value.trim();
    const city = searchText || currentCity;
    
    // Only validate empty input if this is a user-initiated search
    if (!isInitialLoad && !searchText) {
        showNotification(
            'الرجاء إدخال اسم المدينة باللغة الإنجليزية',
            'warning',
            {
                title: 'بيانات ناقصة',
                confirmText: 'حسناً',
                onConfirm: () => cityInput.focus()
            }
        );
        return;
    }
    
    try {
        setLoading(true);
        
        // Fetch prayer times for the city
        const { timings, hijri, location } = await fetchPrayerTimes(city);
        
        // Update application state
        currentCity = `${location.name},${location.country}`;
        
        // Update UI
        updatePrayerTimes(timings);
        updateLocation(location.name, location.country);
        updateNextPrayer();
        
        // Update Hijri date
        document.getElementById('hijriDate').textContent = 
            `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;
        
        // Save preferences
        savePreferences(currentCity, isAudioEnabled);
        
        // Only show success message for user-initiated searches, not initial load
        if (!isInitialLoad) {
            showNotification(
                `تم تحديث مواقيت الصلاة لمدينة ${location.name} بنجاح`,
                'success',
                {
                    title: 'تم التحديث',
                    confirmText: 'تم'
                }
            );
        }
        
    } catch (error) {
        console.error('Error in handleSearch:', error);
        
        let errorMessage = 'حدث خطأ غير متوقع';
        let errorTitle = 'خطأ';
        
        if (error.message === 'City not found') {
            errorMessage = 'المدينة غير موجودة. الرجاء التأكد من الاسم والمحاولة مرة أخرى.';
            errorTitle = 'مدينة غير موجودة';
        } else if (error.message.includes('network')) {
            errorMessage = 'تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.';
            errorTitle = 'خطأ في الاتصال';
        }
        
        const cityInput = document.getElementById('cityInput');
        cityInput.value = ''; // Clear the input
        
        showNotification(errorMessage, 'error', {
            title: errorTitle,
            confirmText: 'حسناً',
            onConfirm: () => cityInput.focus()
        });
        
    } finally {
        setLoading(false);
    }
}

/**
 * Toggles audio notifications
 * @returns {void}
 */
function toggleAudio() {
    isAudioEnabled = !isAudioEnabled;
    updateAudioButton(isAudioEnabled);
    savePreferences(currentCity, isAudioEnabled);
    
    if (isAudioEnabled) {
        // Play test sound when enabling audio
        playAthan();
    }
}

/**
 * Cleans up resources when the page is unloaded
 */
function cleanup() {
    // Clear intervals
    if (updateDateTimeInterval) {
        clearInterval(updateDateTimeInterval);
        updateDateTimeInterval = null;
    }
    
    // Clean up UI resources
    if (window.cleanupUI) {
        window.cleanupUI();
    }
    
    // Clean up audio
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
        audio.pause();
        audio.src = '';
    });
    
    // Remove event listeners
    window.removeEventListener('beforeunload', cleanup);
}

// Clean up when the page is unloaded
window.addEventListener('beforeunload', cleanup);

// Start the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
