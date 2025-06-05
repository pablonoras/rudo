# PWA (Progressive Web App) Setup Guide

Your RUDO app now has PWA functionality implemented! Here's how it works and what you need to know.

## 🚀 What's Implemented

### 1. Smart Install Prompt

- **Location**: Appears on the athlete dashboard
- **Timing**: Shows 2 seconds after page load (for better UX)
- **Mobile-only**: Only displays on mobile devices
- **Smart dismissal**: If dismissed, won't show again for 7 days
- **Auto-hide**: Automatically hidden if app is already installed

### 2. PWA Files Created

- ✅ `PWAInstallPrompt.tsx` - React component for install banner
- ✅ `manifest.json` - PWA app metadata
- ✅ `sw.js` - Service worker for offline functionality
- ✅ Updated `index.html` with PWA meta tags
- ✅ Updated `main.tsx` with service worker registration

## 📱 How Users Install the App

### On Android (Chrome/Edge)

1. Visit your website on mobile Chrome/Edge
2. The install banner will appear after 2 seconds
3. Tap "Install" button
4. App icon will be added to home screen
5. App opens in standalone mode (no browser UI)

### On iOS (Safari)

Note: iOS doesn't support the `beforeinstallprompt` event, so the banner won't appear.
Users need to manually install:

1. Open website in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Confirm installation

## 🛠 Additional Setup Required

### 1. App Icons

You need to create and add these icon files to your `public/` folder:

```
public/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

**Quick icon generation:**

- Use a tool like [PWA Builder](https://www.pwabuilder.com/imageGenerator)
- Upload a 512x512 PNG of your logo
- Download all generated sizes

### 2. Screenshots (Optional but Recommended)

Add these to `public/` for better app store listings:

```
public/
├── screenshot-mobile.png (640x1136)
└── screenshot-desktop.png (1280x800)
```

### 3. HTTPS Requirement

PWAs require HTTPS to work. Make sure your production site uses SSL.

## 🎯 Testing the PWA

### Local Testing

1. Run your development server
2. Open Chrome DevTools
3. Go to Application tab > Manifest
4. Check for any errors
5. Use "Add to homescreen" button to test installation

### Production Testing

1. Deploy to your HTTPS domain
2. Open on mobile Chrome
3. Wait for install prompt to appear
4. Test installation flow

## 🔧 Customization Options

### Modify Install Prompt Behavior

Edit `src/components/PWAInstallPrompt.tsx`:

- Change the 2-second delay: modify `setTimeout` value
- Change dismissal period: modify the 7-day check
- Customize appearance: update the Tailwind classes
- Add different messages: modify text content

### Update App Metadata

Edit `public/manifest.json`:

- Change app name and description
- Update theme colors
- Modify start URL
- Add/remove icon sizes

### Service Worker Caching

Edit `public/sw.js`:

- Add more URLs to cache
- Implement different caching strategies
- Add offline fallback pages

## 📊 Analytics & Monitoring

### Track Install Events

The component logs install attempts. You can integrate with your analytics:

```javascript
// In PWAInstallPrompt.tsx, add to handleInstall:
if (choiceResult.outcome === "accepted") {
  // Track successful install
  analytics.track("pwa_installed");
}
```

### Monitor Usage

Track if users are using the standalone app:

```javascript
// Check if running as PWA
const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
```

## 🎨 Best Practices Implemented

✅ **Smart timing** - Shows after user engagement, not immediately
✅ **Mobile-first** - Only shows on mobile where installation makes sense
✅ **Respectful dismissal** - Doesn't nag users who aren't interested
✅ **Visual hierarchy** - Subtle banner design that doesn't interrupt workflow
✅ **Loading states** - Shows installation progress
✅ **Accessibility** - Proper ARIA labels and keyboard navigation

## 🔍 Troubleshooting

### Install Prompt Not Showing?

1. Check browser console for errors
2. Ensure you're on HTTPS (required for PWA)
3. Verify manifest.json is accessible
4. Check if app is already installed
5. Test on different mobile browsers

### Service Worker Issues?

1. Check Application tab in DevTools
2. Look for service worker registration errors
3. Try hard refresh (Ctrl+Shift+R)
4. Clear cache and storage

### Icons Not Loading?

1. Verify icon files exist in public/ folder
2. Check file names match manifest.json exactly
3. Ensure icons are PNG format
4. Test icon URLs directly in browser

## 🚀 Next Steps

1. **Create app icons** - This is the most important missing piece
2. **Test on real devices** - Especially Android phones with Chrome
3. **Add to CI/CD** - Ensure PWA files are deployed
4. **Monitor install rates** - Track how many users install the app
5. **Consider push notifications** - Next PWA feature to implement

The PWA functionality is now fully integrated and ready to use! Just add the app icons and you're good to go.
