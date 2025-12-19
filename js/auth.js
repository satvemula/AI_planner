/**
 * Authentication Module
 * Handles login, register, and token management
 */

import { api } from './api.js';
import { secureStorage, triggerHaptic } from './mobile.js';

let authModal;
let loginForm;
let registerForm;
let authSwitchBtn;
let authSwitchText;
let loginError;
let registerError;
let logoutBtn;

/**
 * Initialize authentication
 */
export function initAuth() {
    // DOM Elements
    authModal = document.getElementById('auth-modal');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    authSwitchBtn = document.getElementById('auth-switch-btn');
    authSwitchText = document.getElementById('auth-switch-text');
    loginError = document.getElementById('login-error');
    registerError = document.getElementById('register-error');
    logoutBtn = document.getElementById('logout-btn');

    // Event Listeners
    if (authSwitchBtn) {
        authSwitchBtn.addEventListener('click', toggleAuthMode);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Check if authenticated (don't await here, app.js will handle it)
    // The modal will be shown by app.js if not authenticated
}

/**
 * Check if user is authenticated
 * If not, show auth modal
 */
export async function checkAuth() {
    let token;
    if (window.Capacitor) {
        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key: 'access_token' });
        token = value;
    } else {
        token = localStorage.getItem('access_token');
    }

    if (!token) {
        showAuthModal();
        return false;
    }

    return true;
}

/**
 * Show authentication modal
 */
function showAuthModal() {
    if (authModal) {
        authModal.classList.add('active');
        // Also ensure main content is hidden
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
    } else {
        console.error('Auth modal element not found');
    }
}

/**
 * Hide authentication modal
 */
function hideAuthModal() {
    if (authModal) {
        authModal.classList.remove('active');
    }
}

/**
 * Toggle between Login and Register modes
 */
function toggleAuthMode(e) {
    e.preventDefault();

    // Clear errors
    loginError.style.display = 'none';
    registerError.style.display = 'none';

    if (loginForm.style.display !== 'none') {
        // Switch to Register
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authSwitchText.textContent = 'Already have an account?';
        authSwitchBtn.textContent = 'Sign In';
        document.getElementById('auth-title').textContent = 'Create Account';
    } else {
        // Switch to Login
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        authSwitchText.textContent = "Don't have an account?";
        authSwitchBtn.textContent = 'Sign Up';
        document.getElementById('auth-title').textContent = 'Welcome';
    }
}

/**
 * Handle Login Submission
 */
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await api.auth.login(email, password);

        // Store tokens using secure storage
        if (window.Capacitor) {
            const { Preferences } = await import('@capacitor/preferences');
            await Preferences.set({ key: 'access_token', value: response.tokens.access_token });
            await Preferences.set({ key: 'refresh_token', value: response.tokens.refresh_token });
            await Preferences.set({ key: 'user', value: JSON.stringify(response.user) });
        } else {
            localStorage.setItem('access_token', response.tokens.access_token);
            localStorage.setItem('refresh_token', response.tokens.refresh_token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        // Haptic feedback on mobile
        await triggerHaptic();

        // Update UI
        hideAuthModal();
        // Show main content
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = '';
        }
        window.location.reload(); // Reload to fetch user data/tasks

    } catch (error) {
        loginError.textContent = error.message || 'Login failed. Please check your credentials.';
        loginError.style.display = 'block';
        await triggerHaptic();
    }
}

/**
 * Handle Register Submission
 */
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await api.auth.register(email, name, password);

        // Store tokens using secure storage
        if (window.Capacitor) {
            const { Preferences } = await import('@capacitor/preferences');
            await Preferences.set({ key: 'access_token', value: response.tokens.access_token });
            await Preferences.set({ key: 'refresh_token', value: response.tokens.refresh_token });
            await Preferences.set({ key: 'user', value: JSON.stringify(response.user) });
        } else {
            localStorage.setItem('access_token', response.tokens.access_token);
            localStorage.setItem('refresh_token', response.tokens.refresh_token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        // Haptic feedback on mobile
        await triggerHaptic();

        // Update UI
        hideAuthModal();
        // Show main content
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = '';
        }
        window.location.reload();

    } catch (error) {
        registerError.textContent = error.message || 'Registration failed. Please try again.';
        registerError.style.display = 'block';
        await triggerHaptic();
    }
}

/**
 * Handle Logout
 */
async function handleLogout(e) {
    e.preventDefault();

    // Clear tokens from secure storage
    if (window.Capacitor) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key: 'access_token' });
        await Preferences.remove({ key: 'refresh_token' });
        await Preferences.remove({ key: 'user' });
    } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }

    window.location.reload();
}
