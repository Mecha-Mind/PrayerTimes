/**
 * @fileoverview Module for UI related functions
 * @module ui
 */

import { formatTime, formatTimeRemaining, getPrayerArabicName } from './utils.js';

// DOM Elements
const elements = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    currentDate: document.getElementById('currentDate'),
    athanAudio: document.getElementById('athanAudio'),
    hijriDate: document.getElementById('hijriDate'),
    currentLocation: document.getElementById('currentLocation'),
    nextPrayerName: document.getElementById('nextPrayerName'),
    nextPrayerName2: document.getElementById('nextPrayerName2'),
    countdown: document.getElementById('countdown'),
    toggleAudioBtn: document.getElementById('toggleAudio'),
    notificationPopup: document.getElementById('notificationPopup'),
    notificationMessage: document.getElementById('notificationMessage'),
    closeNotificationBtn: document.getElementById('closeNotification'),
    notificationActionBtn: document.getElementById('notificationAction'),
    reportBugBtn: document.getElementById('reportBug')
};

// Prayer time elements
elements.prayerTimeElements = {
    fajr: document.querySelector('#fajr .time'),
    sunrise: document.querySelector('#sunrise .time'),
    dhuhr: document.querySelector('#dhuhr .time'),
    asr: document.querySelector('#asr .time'),
    maghrib: document.querySelector('#maghrib .time'),
    isha: document.querySelector('#isha .time')
};

// State
let prayerTimes = {};
let nextPrayer = null;
let countdownInterval = null;

// Clean up function for UI module
function cleanupUI() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    // Clean up event listeners
    const elements = getElements();
    elements.searchBtn.replaceWith(elements.searchBtn.cloneNode(true));
    elements.cityInput.replaceWith(elements.cityInput.cloneNode(true));
    elements.toggleAudioBtn.replaceWith(elements.toggleAudioBtn.cloneNode(true));
    
    // Reinitialize event listeners
    setupEventListeners(window.handleSearch, window.toggleAudio);
}

// Add cleanup to window for global access
window.cleanupUI = cleanupUI;

/**
 * Updates the prayer times display
 * @param {Object} timings - Prayer timings
 * @returns {void}
 */
export function updatePrayerTimes(timings) {
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
        if (elements.prayerTimeElements[prayer]) {
            elements.prayerTimeElements[prayer].textContent = time;
        }
    }
}

/**
 * Updates the next prayer information
 * @returns {Object|null} Next prayer info
 */
export function updateNextPrayer() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Reset active states
    document.querySelectorAll('.prayer-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Find next prayer
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
    
    // Highlight current prayer
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
    
    elements.nextPrayerName.textContent = nextPrayer.displayName;
    elements.nextPrayerName2.textContent = nextPrayer.displayName;
    
    // Start countdown
    startCountdown();
    
    return nextPrayer;
}

/**
 * Starts the countdown timer
 * @returns {void}
 */
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

/**
 * Updates the countdown display
 * @returns {boolean} True if successful
 */
function updateCountdown() {
    try {
        const now = new Date();
        const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        
        if (!nextPrayer || !prayerTimes || !prayerTimes[nextPrayer?.name]) {
            elements.countdown.textContent = '--:--:--';
            return false;
        }
        
        const prayerTimeStr = prayerTimes[nextPrayer.name];
        const [time, period] = prayerTimeStr.split(' ');
        const [hoursStr, minutesStr] = time.split(':');
        
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        
        if (isNaN(hours) || isNaN(minutes)) {
            console.error('Invalid time format:', time);
            return false;
        }
        
        // Convert to 24-hour format
        if (period === 'م' && hours < 12) hours += 12;
        if (period === 'ص' && hours === 12) hours = 0;
        
        const prayerTimeInSeconds = hours * 3600 + minutes * 60;
        let timeRemaining = prayerTimeInSeconds - currentTime;
        
        // Handle next day
        if (timeRemaining < 0) timeRemaining += 24 * 3600;
        
        elements.countdown.textContent = formatTimeRemaining(timeRemaining);
        return true;
    } catch (error) {
        console.error('Error in updateCountdown:', error);
        elements.countdown.textContent = '--:--:--';
        return false;
    }
}

/**
 * Shows a notification popup
 * @param {string} message - Message to display
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - Notification type
 * @param {Object} [options] - Additional options
 * @param {string} [options.title] - Custom title for the notification
 * @param {Function} [options.onConfirm] - Callback when user confirms
 * @param {string} [options.confirmText='حسناً'] - Text for the confirm button
 * @returns {void}
 */
export function showNotification(message, type = 'info', options = {}) {
    // Update message
    elements.notificationMessage.textContent = message;
    
    // Set icon and colors based on type
    const notificationTypes = {
        error: { 
            icon: 'fa-exclamation-circle', 
            color: '#ff4444',
            title: 'خطأ'
        },
        success: { 
            icon: 'fa-check-circle', 
            color: '#4CAF50',
            title: 'نجاح'
        },
        warning: { 
            icon: 'fa-exclamation-triangle', 
            color: '#FFC107',
            title: 'تحذير'
        },
        info: { 
            icon: 'fa-info-circle', 
            color: '#2196F3',
            title: 'معلومة'
        }
    };
    
    const notificationType = notificationTypes[type] || notificationTypes.info;
    const icon = elements.notificationPopup.querySelector('.notification-icon i');
    const titleElement = elements.notificationPopup.querySelector('.notification-title');
    const actionButton = elements.notificationPopup.querySelector('#notificationAction');
    
    // Update notification UI
    icon.className = `fas ${notificationType.icon}`;
    icon.parentElement.style.backgroundColor = notificationType.color;
    titleElement.textContent = options.title || notificationType.title;
    actionButton.textContent = options.confirmText || 'حسناً';
    
    // Set up confirmation handler
    const handleConfirm = () => {
        if (typeof options.onConfirm === 'function') {
            options.onConfirm();
        }
        hideNotification();
    };
    
    // Remove previous event listeners to avoid duplicates
    actionButton.replaceWith(actionButton.cloneNode(true));
    const newActionButton = elements.notificationPopup.querySelector('#notificationAction');
    newActionButton.addEventListener('click', handleConfirm);
    
    // Show the popup
    elements.notificationPopup.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Auto-hide after 5 seconds if not a critical message
    if (type !== 'error') {
        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(hideNotification, 5000);
    }
}

let notificationTimeout;

/**
 * Hides the notification popup
 * @returns {void}
 */
export function hideNotification() {
    clearTimeout(notificationTimeout);
    elements.notificationPopup.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clean up any existing event listeners
    const actionButton = elements.notificationPopup.querySelector('#notificationAction');
    actionButton.replaceWith(actionButton.cloneNode(true));
}

/**
 * Updates the current date display
 * @returns {void}
 */
export function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    elements.currentDate.textContent = now.toLocaleDateString('ar-EG', options);
    updateNextPrayer();
}

/**
 * Updates the location display
 * @param {string} name - City name
 * @param {string} country - Country name
 * @returns {void}
 */
export function updateLocation(name, country) {
    elements.currentLocation.textContent = `${name}, ${country}`;
}

/**
 * Sets up all event listeners
 * @param {Function} onSearch - Search handler
 * @param {Function} onToggleAudio - Audio toggle handler
 * @returns {void}
 */
export function setupEventListeners(onSearch, onToggleAudio) {
    // Search button and input with validation
    elements.searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const searchText = elements.cityInput.value.trim();
        if (searchText) {
            onSearch();
        } else {
            // Show error message if search input is empty
            showNotification(
                'الرجاء إدخال اسم المدينة أولاً',
                'warning',
                {
                    title: 'بيانات ناقصة',
                    confirmText: 'حسناً',
                    onConfirm: () => elements.cityInput.focus()
                }
            );
        }
    });
    
    elements.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const searchText = elements.cityInput.value.trim();
            if (searchText) {
                onSearch();
            } else {
                // Show error message if search input is empty
                showNotification(
                    'الرجاء إدخال اسم المدينة أولاً',
                    'warning',
                    {
                        title: 'بيانات ناقصة',
                        confirmText: 'حسناً',
                        onConfirm: () => elements.cityInput.focus()
                    }
                );
            }
        }
    });
    
    // Audio toggle
    elements.toggleAudioBtn.addEventListener('click', onToggleAudio);
    
    // Notification popup
    elements.closeNotificationBtn.addEventListener('click', hideNotification);
    elements.notificationActionBtn.addEventListener('click', hideNotification);
    elements.notificationPopup.addEventListener('click', (e) => {
        if (e.target === elements.notificationPopup) hideNotification();
    });
    
    // Report bug button
    elements.reportBugBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://my-nextjs-portfolio-sigma.vercel.app/contact', '_blank');
    });
}

/**
 * Updates the audio button state
 * @param {boolean} isEnabled - Whether audio is enabled
 * @returns {void}
 */
export function updateAudioButton(isEnabled) {
    if (isEnabled) {
        elements.toggleAudioBtn.innerHTML = '<i class="fas fa-volume-up"></i> إيقاف التنبيه الصوتي';
        elements.toggleAudioBtn.classList.remove('muted');
    } else {
        elements.toggleAudioBtn.innerHTML = '<i class="fas fa-volume-mute"></i> تفعيل التنبيه الصوتي';
        elements.toggleAudioBtn.classList.add('muted');
    }
}

/**
 * Plays the Athan audio
 * @returns {void}
 */
export function playAthan() {
    elements.athanAudio.currentTime = 0;
    elements.athanAudio.play().catch(error => {
        console.error('Error playing athan:', error);
    });
}

/**
 * Shows loading state
 * @param {boolean} isLoading - Whether to show loading state
 * @returns {void}
 */
export function setLoading(isLoading) {
    if (isLoading) {
        elements.countdown.textContent = 'جاري التحميل...';
        elements.currentLocation.textContent = 'جاري التحميل...';
    }
}
