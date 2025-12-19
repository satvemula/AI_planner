# Deployment Guide

This guide covers deploying your Planner Winter app to production and app stores.

## Backend Deployment

Your FastAPI backend needs to be deployed and accessible via HTTPS.

### Recommended Platforms

#### 1. Railway (Easiest)
- Sign up at [railway.app](https://railway.app)
- Connect your GitHub repo
- Add environment variables
- Deploy automatically

#### 2. Render
- Sign up at [render.com](https://render.com)
- Create a new Web Service
- Connect your repo
- Set build command: `pip install -r requirements.txt`
- Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### 3. Heroku
```bash
# Install Heroku CLI
heroku create planner-winter-api
heroku addons:create heroku-postgresql
git push heroku main
```

#### 4. DigitalOcean App Platform
- Create new app from GitHub
- Select Python runtime
- Configure environment variables
- Deploy

### Environment Variables for Production

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
JWT_SECRET_KEY=<generate-strong-secret>
OPENAI_API_KEY=your-key
FRONTEND_URL=https://your-frontend-url.com
DEBUG=False
```

### CORS Configuration

Update your backend `main.py` to allow your mobile app:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "capacitor://localhost",
        "ionic://localhost",
        "http://localhost",
        "https://your-frontend-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Mobile App Deployment

### iOS App Store

#### 1. Prepare Your App

1. **Update App Metadata in Xcode:**
   - Open `ios/App/App.xcodeproj`
   - Set Display Name, Bundle ID, Version
   - Configure App Icons and Launch Screen

2. **Configure Signing:**
   - Select your development team
   - Enable "Automatically manage signing"
   - Or manually configure certificates

#### 2. Build for App Store

1. **Archive:**
   - Product → Archive
   - Wait for archive to complete

2. **Distribute:**
   - Window → Organizer
   - Select your archive
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the wizard

#### 3. Submit to App Store Connect

1. **Create App Listing:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Click "+" to create new app
   - Fill in:
     - Name: "Planner Winter"
     - Primary Language
     - Bundle ID (must match Xcode)
     - SKU (unique identifier)

2. **App Information:**
   - Category: Productivity
   - Privacy Policy URL (required)
   - Support URL

3. **Pricing and Availability:**
   - Set price (Free or Paid)
   - Select countries

4. **App Store Listing:**
   - Screenshots (required for each device size)
   - Description
   - Keywords
   - Promotional text
   - App icon (1024x1024)

5. **Version Information:**
   - What's New in This Version
   - Build selection (after upload)

6. **Submit for Review:**
   - Complete all required sections
   - Submit for review
   - Wait for approval (usually 1-3 days)

### Google Play Store

#### 1. Prepare Your App

1. **Generate Signed Bundle:**
   ```bash
   # In Android Studio:
   Build → Generate Signed Bundle / APK
   → Android App Bundle
   → Create new keystore (save securely!)
   → Fill in details
   → Generate
   ```

2. **Save Keystore Securely:**
   - Store keystore file safely
   - Save password securely
   - You'll need this for all future updates

#### 2. Create App in Play Console

1. **Sign Up:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Pay one-time $25 registration fee

2. **Create App:**
   - Click "Create app"
   - Fill in:
     - App name: "Planner Winter"
     - Default language
     - App or Game: App
     - Free or Paid

#### 3. Complete Store Listing

1. **App Details:**
   - Short description (80 chars)
   - Full description (4000 chars)
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots (at least 2, up to 8)

2. **Content Rating:**
   - Complete questionnaire
   - Get rating certificate

3. **Privacy Policy:**
   - Required URL
   - Must be accessible

4. **Target Audience:**
   - Age groups
   - Content guidelines

#### 4. Upload and Release

1. **Internal Testing:**
   - Create internal test track
   - Upload AAB file
   - Test with internal testers

2. **Production Release:**
   - Create production release
   - Upload AAB
   - Set rollout percentage (start with 20%)
   - Submit for review

3. **Review Process:**
   - Usually takes 1-7 days
   - Address any issues if rejected

## App Store Assets Checklist

### iOS App Store

- [ ] App Icon (1024x1024 PNG)
- [ ] Screenshots:
  - [ ] iPhone 6.7" (1290x2796)
  - [ ] iPhone 6.5" (1284x2778)
  - [ ] iPhone 5.5" (1242x2208)
  - [ ] iPad Pro 12.9" (2048x2732)
- [ ] App Preview Video (optional)
- [ ] Description (up to 4000 chars)
- [ ] Keywords (up to 100 chars)
- [ ] Support URL
- [ ] Privacy Policy URL
- [ ] Marketing URL (optional)

### Google Play Store

- [ ] App Icon (512x512 PNG)
- [ ] Feature Graphic (1024x500 PNG)
- [ ] Screenshots (at least 2):
  - [ ] Phone (16:9 or 9:16)
  - [ ] Tablet (7" or 10")
- [ ] Short Description (80 chars)
- [ ] Full Description (4000 chars)
- [ ] Privacy Policy URL
- [ ] Content Rating Certificate

## Post-Deployment

### Monitoring

- Set up error tracking (Sentry, Bugsnag)
- Monitor API usage
- Track app crashes
- Monitor user feedback

### Updates

1. **Update Version:**
   - Increment version in `package.json`
   - Update in Xcode/Android Studio
   - Run `npm run cap:sync`

2. **Build and Upload:**
   - Follow same process as initial deployment
   - Submit update for review

### Marketing

- Create landing page
- Set up analytics
- Prepare social media assets
- Write blog post/announcement

## Troubleshooting

### iOS Rejection

Common reasons:
- Missing privacy policy
- App crashes
- Broken functionality
- Guideline violations

**Solution:** Address feedback, fix issues, resubmit

### Android Rejection

Common reasons:
- Policy violations
- Missing permissions explanation
- Broken functionality

**Solution:** Review policies, update app, resubmit

## Resources

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Capacitor Deployment Docs](https://capacitorjs.com/docs/guides/deploying-updates)



