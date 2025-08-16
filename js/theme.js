/**
 * @fileoverview Handles theme switching functionality
 * @module theme
 */

/**
 * Initializes the theme functionality
 * @returns {void}
 */
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
    }
    
    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', toggleTheme);
    
    // Update button state based on current theme
    updateThemeButton();
}

/**
 * Toggles between light and dark theme
 * @returns {void}
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update theme
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save preference
    localStorage.setItem('theme', newTheme);
    
    // Update button state
    updateThemeButton();
}

/**
 * Updates the theme toggle button state
 * @returns {void}
 */
function updateThemeButton() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const isDark = currentTheme === 'dark';
    
    // Update button title and aria-label
    const title = isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع المظلم';
    themeToggle.setAttribute('title', title);
    themeToggle.setAttribute('aria-label', title);
    
    // Update button icon
    const moonIcon = themeToggle.querySelector('.fa-moon');
    const sunIcon = themeToggle.querySelector('.fa-sun');
    
    if (isDark) {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    } else {
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
    }
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initTheme);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initTheme,
        toggleTheme,
        updateThemeButton
    };
}
