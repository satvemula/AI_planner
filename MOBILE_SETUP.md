# Mobile App Setup Guide

This guide will help you convert your web app into a mobile app for iOS and Android using Capacitor.

## Prerequisites

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **iOS Development** (for iOS builds):
   - macOS with Xcode (latest version)
   - Apple Developer Account ($99/year)
3. **Android Development** (for Android builds):
   - Android Studio
   - Java Development Kit (JDK 11 or higher)

## Step 1: Install Dependencies

```bash
npm install
```

This will install Capacitor and all required plugins.

## Step 2: Initialize Capacitor

```bash
# Add iOS platform
npm run cap:add:ios

# Add Android platform
npm run cap:add:android
```

## Step 3: Configure Your Backend API

Before building for mobile, you need to update the API URL:

1. Open `js/api.js`
2. Find the `getApiBaseUrl()` function
3. Update the production URL:
   ```javascript
   return 'https://your-backend-api.com/api/v1';
   ```

**For Development/Testing:**
- Use your local IP address (e.g., `http://192.168.1.100:8000`)
- Make sure your phone and computer are on the same network
- Update the URL in `js/api.js` temporarily

## Step 4: Configure App Metadata

### iOS Configuration

1. Open `ios/App/App.xcodeproj` in Xcode
2. Select the project in the navigator
3. Update:
   - **Display Name**: "Planner Winter"
   - **Bundle Identifier**: `com.plannerwinter.app` (or your own)
   - **Version**: `1.0.0`
   - **Build**: `1`

### Android Configuration

1. Open `android/app/build.gradle`
2. Update:
   ```gradle
   applicationId "com.plannerwinter.app"
   versionCode 1
   versionName "1.0.0"
   ```

## Step 5: Add App Icons and Splash Screens

### iOS Icons

1. Create icons in various sizes (use an icon generator tool)
2. Place them in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
3. Required sizes: 20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024

### Android Icons

1. Create icons in various densities
2. Place them in `android/app/src/main/res/`:
   - `mipmap-mdpi/` (48x48)
   - `mipmap-hdpi/` (72x72)
   - `mipmap-xhdpi/` (96x96)
   - `mipmap-xxhdpi/` (144x144)
   - `mipmap-xxxhdpi/` (192x192)

### Splash Screens

Splash screens are configured in `capacitor.config.ts`. Update the `SplashScreen` plugin settings as needed.

## Step 6: Build and Test

### iOS

```bash
# Sync web assets to iOS
npm run cap:sync

# Open in Xcode
npm run cap:open:ios

# In Xcode:
# 1. Select a simulator or connected device
# 2. Click the Play button to build and run
```

### Android

```bash
# Sync web assets to Android
npm run cap:sync

# Open in Android Studio
npm run cap:open:android

# In Android Studio:
# 1. Click "Run" or press Shift+F10
# 2. Select an emulator or connected device
```

## Step 7: Deploy to App Stores

### iOS App Store

1. **Archive the app in Xcode:**
   - Product → Archive
   - Wait for archive to complete

2. **Upload to App Store Connect:**
   - Window → Organizer
   - Select your archive
   - Click "Distribute App"
   - Follow the wizard

3. **Submit for Review:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com/)
   - Create a new app listing
   - Fill in all required information
   - Submit for review

### Google Play Store

1. **Generate a signed APK/AAB:**
   - In Android Studio: Build → Generate Signed Bundle / APK
   - Follow the wizard to create a keystore
   - Generate the release bundle

2. **Upload to Play Console:**
   - Go to [Google Play Console](https://play.google.com/console/)
   - Create a new app
   - Upload your AAB file
   - Fill in store listing information
   - Submit for review

## Important Notes

### Backend Deployment

Your FastAPI backend needs to be deployed and accessible:
- Use services like:
  - **Heroku** (easy setup)
  - **Railway** (good for Python)
  - **AWS** (scalable)
  - **DigitalOcean** (affordable)
  - **Render** (simple deployment)

### API Security

- Use HTTPS for all API calls in production
- Implement CORS properly on your backend
- Consider adding API rate limiting
- Use environment variables for API keys

### Testing Checklist

- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Test offline behavior
- [ ] Test authentication flow
- [ ] Test task creation/editing
- [ ] Test calendar drag-and-drop
- [ ] Test AI duration estimation
- [ ] Test push notifications (if implemented)

## Troubleshooting

### "Cannot connect to API" on mobile

- Make sure your backend is deployed and accessible
- Check CORS settings on your backend
- Verify the API URL in `js/api.js`
- For local testing, use your computer's IP address

### Build errors

- Run `npm run cap:sync` after any web asset changes
- Clean build folders in Xcode/Android Studio
- Delete `node_modules` and reinstall

### Icons not showing

- Make sure all required icon sizes are present
- Run `npm run cap:sync` after adding icons
- Clean and rebuild the app

## Next Steps

1. **Push Notifications**: Add push notification support for task reminders
2. **Offline Support**: Implement offline task storage using Capacitor Storage
3. **Biometric Auth**: Add fingerprint/face ID authentication
4. **Calendar Integration**: Connect to device calendar
5. **Widgets**: Create home screen widgets (iOS/Android)

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)



