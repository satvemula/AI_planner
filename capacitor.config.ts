import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plannerwinter.app',
  appName: 'Planner Winter',
  webDir: '.',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // For development, you can uncomment this to use your local server
    // url: 'http://YOUR_IP_ADDRESS:8080',
    // cleartext: true
    // Note: Replace YOUR_IP_ADDRESS with your computer's local IP (e.g., 192.168.1.100)
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#2563EB',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#2563EB',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;

