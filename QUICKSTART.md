# Quick Start Guide

Get your Planner Winter app running on mobile in 5 minutes!

## Prerequisites Check

- ✅ Node.js installed? Run: `node --version` (should be 16+)
- ✅ Backend running? Make sure your FastAPI server is running on port 8000

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Update API URL

**Important:** Before building for mobile, update your API URL in `js/api.js`:

```javascript
// For production, use your deployed backend:
return 'https://your-backend-api.com/api/v1';

// For local testing on mobile device, use your computer's IP:
// Find your IP: ifconfig (Mac/Linux) or ipconfig (Windows)
return 'http://192.168.1.XXX:8000/api/v1';
```

## Step 3: Add Mobile Platforms

### iOS (macOS only)

```bash
npm run cap:add:ios
npm run cap:open:ios
```

Then in Xcode:
1. Select a simulator or connected iPhone
2. Click the Play button ▶️

### Android

```bash
npm run cap:add:android
npm run cap:open:android
```

Then in Android Studio:
1. Select an emulator or connected device
2. Click Run ▶️

## Step 4: Test on Device

1. Make sure your phone and computer are on the same WiFi network
2. Update API URL to use your computer's IP address
3. Run `npm run cap:sync` to sync changes
4. Build and run on your device

## Common Issues

### "Cannot connect to API"
- ✅ Check your backend is running
- ✅ Verify API URL in `js/api.js`
- ✅ Check CORS settings on backend
- ✅ For local testing, use your computer's IP (not localhost)

### Build Errors
- ✅ Run `npm run cap:sync` after any changes
- ✅ Clean build in Xcode/Android Studio
- ✅ Delete `node_modules` and reinstall

### Icons Missing
- ✅ Add app icons (see MOBILE_SETUP.md)
- ✅ Run `npm run cap:sync`

## Next Steps

- 📖 Read [MOBILE_SETUP.md](./MOBILE_SETUP.md) for detailed setup
- 🚀 See [README.md](./README.md) for full documentation
- 📱 Prepare for App Store deployment

## Need Help?

- Check the [Capacitor Docs](https://capacitorjs.com/docs)
- Review error messages in Xcode/Android Studio console
- Make sure all prerequisites are installed

