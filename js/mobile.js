/**
 * Mobile-specific functionality using Capacitor
 * Handles native features like secure storage, haptics, app lifecycle
 */

let isMobile = false;
let CapacitorPlugins = null;

// Dynamically import Capacitor plugins only if available
async function loadCapacitorPlugins() {
  if (window.Capacitor) {
    try {
      CapacitorPlugins = {
        Preferences: (await import('@capacitor/preferences')).Preferences,
        App: (await import('@capacitor/app')).App,
        StatusBar: (await import('@capacitor/status-bar')).StatusBar,
        Keyboard: (await import('@capacitor/keyboard')).Keyboard,
        Haptics: (await import('@capacitor/haptics')).Haptics,
        SplashScreen: (await import('@capacitor/splash-screen')).SplashScreen,
        Style: (await import('@capacitor/status-bar')).Style,
        ImpactStyle: (await import('@capacitor/haptics')).ImpactStyle,
      };
      return true;
    } catch (error) {
      console.warn('Capacitor plugins not available:', error);
      return false;
    }
  }
  return false;
}

/**
 * Initialize mobile-specific features
 */
export async function initMobile() {
  // Check if running in Capacitor and load plugins
  const pluginsLoaded = await loadCapacitorPlugins();
  
  if (pluginsLoaded) {
    isMobile = true;
    await setupMobileFeatures();
  }
  
  return isMobile;
}

/**
 * Setup mobile-specific features
 */
async function setupMobileFeatures() {
  if (!CapacitorPlugins) return;
  
  try {
    const { StatusBar, Style, SplashScreen, App, Keyboard } = CapacitorPlugins;
    
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#2563EB' });
    
    // Hide splash screen after app is ready
    await SplashScreen.hide();
    
    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });
    
    // Handle back button (Android)
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });
    
    // Handle keyboard events
    Keyboard.addListener('keyboardWillShow', (info) => {
      console.log('Keyboard will show with height:', info.keyboardHeight);
    });
    
    Keyboard.addListener('keyboardWillHide', () => {
      console.log('Keyboard will hide');
    });
    
    console.log('Mobile features initialized');
  } catch (error) {
    console.error('Error initializing mobile features:', error);
  }
}

/**
 * Secure storage wrapper - uses Capacitor Preferences on mobile, localStorage on web
 */
export const secureStorage = {
  async set(key, value) {
    if (isMobile && CapacitorPlugins?.Preferences) {
      await CapacitorPlugins.Preferences.set({ key, value: JSON.stringify(value) });
    } else {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  },
  
  async get(key) {
    if (isMobile && CapacitorPlugins?.Preferences) {
      const { value } = await CapacitorPlugins.Preferences.get({ key });
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } else {
      const value = localStorage.getItem(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
  },
  
  async remove(key) {
    if (isMobile && CapacitorPlugins?.Preferences) {
      await CapacitorPlugins.Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
  
  async clear() {
    if (isMobile && CapacitorPlugins?.Preferences) {
      await CapacitorPlugins.Preferences.clear();
    } else {
      localStorage.clear();
    }
  }
};

/**
 * Trigger haptic feedback
 */
export async function triggerHaptic(style = 'Medium') {
  if (isMobile && CapacitorPlugins?.Haptics && CapacitorPlugins?.ImpactStyle) {
    try {
      const impactStyle = CapacitorPlugins.ImpactStyle[style] || CapacitorPlugins.ImpactStyle.Medium;
      await CapacitorPlugins.Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }
}

/**
 * Check if running on mobile
 */
export function isMobileDevice() {
  return isMobile;
}

/**
 * Get app info
 */
export async function getAppInfo() {
  if (isMobile && CapacitorPlugins?.App) {
    try {
      const info = await CapacitorPlugins.App.getInfo();
      return info;
    } catch (error) {
      console.error('Error getting app info:', error);
      return null;
    }
  }
  return null;
}

