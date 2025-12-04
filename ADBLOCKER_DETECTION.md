# Ad-Blocker Detection System

## Overview

This system automatically detects when users visit the site with an active ad-blocker and displays a modal pop-up requesting them to disable it.

## Features

✅ **Multi-method Detection** - Uses 5 different detection methods for reliability  
✅ **Cross-browser Support** - Works on Chrome, Firefox, Safari, Edge, and more  
✅ **Major Ad-blocker Support** - Detects uBlock Origin, AdBlock Plus, AdGuard, Privacy Badger, and more  
✅ **Smooth Animations** - Fade-in animations for professional appearance  
✅ **Responsive Design** - Works on desktop, tablet, and mobile devices  
✅ **Non-closable Modal** - Users must click "Allow ads" to dismiss (optional close button available)  
✅ **Background Blur** - Entire site is dimmed and blurred when modal is shown  
✅ **LocalStorage Memory** - Remembers if user dismissed the warning (optional)

---

## How It Works

### Detection Methods

The system uses 5 different detection methods:

1. **Ad Container Element Check** - Creates a test ad element and checks if it's blocked
2. **Ad Script Loading** - Attempts to load Google AdSense script and detects if blocked
3. **Network Request Check** - Tries to fetch ad resources and detects failures
4. **Global Variable Check** - Checks for common ad-blocker global variables
5. **Iframe Blocking Check** - Tests if ad-related iframes are blocked

If **2 or more methods** detect an ad-blocker, the modal is shown.

### Modal Display

When an ad-blocker is detected:

1. **Background Overlay** - Dark semi-transparent overlay with blur effect
2. **Site Content** - Entire site is dimmed (70% brightness) and blurred (4px)
3. **Modal Pop-up** - Centered modal with:
   - Warning icon (orange AlertCircle)
   - Title: "Please allow ads on our site"
   - Description explaining why ads are needed
   - "Allow ads" button (primary action)
   - "I understand" button (secondary, dismisses warning)

### User Actions

- **Click "Allow ads"** - Dismisses modal and stores preference in localStorage
- **Click "I understand"** - Dismisses modal and stores preference in localStorage
- **Modal cannot be closed** by:
  - Clicking outside the modal
  - Pressing Escape key
  - Default close button is hidden

---

## Implementation

### Component Location

```
client/components/AdBlockerDetector.tsx
```

### Integration

The component is automatically added to `App.tsx` and runs on all pages:

```tsx
import AdBlockerDetector from "@/components/AdBlockerDetector";

// In App component:
<BrowserRouter>
  <ThemeAnimationWrapper />
  <AdBlockerDetector />
  <AppRoutes />
</BrowserRouter>
```

### Styling

The blur effect is added via `client/global.css`:

```css
body.adblock-modal-open > #root {
  filter: blur(4px) brightness(0.7);
  transition: filter 0.3s ease-in-out;
  pointer-events: none;
  user-select: none;
}
```

---

## Configuration

### Make Modal Non-Closable

The modal is currently **non-closable** except via buttons. To make it closable:

1. Remove `onInteractOutside` and `onEscapeKeyDown` preventDefault calls
2. Uncomment the close button in the Dialog component

### Disable localStorage Memory

To show the warning every time (not remember dismissal):

Remove or comment out these lines in `AdBlockerDetector.tsx`:

```tsx
// Remove this check:
const dismissed = localStorage.getItem("adblock-dismissed");
if (dismissed === "true") {
  setIsDismissed(true);
  return;
}

// Remove these lines:
localStorage.setItem("adblock-dismissed", "true");
```

### Customize Detection Sensitivity

To change how many detection methods must trigger:

In `detectAdBlocker()`, modify this line:

```tsx
// Current: 2 or more methods must detect
resolve(positiveChecks >= 2 || detectedCount >= 2);

// More strict: 3 or more
resolve(positiveChecks >= 3 || detectedCount >= 3);

// Less strict: 1 or more
resolve(positiveChecks >= 1 || detectedCount >= 1);
```

### Customize Modal Content

Edit the modal content in `AdBlockerDetector.tsx`:

```tsx
<DialogTitle>Your Custom Title</DialogTitle>
<DialogDescription>Your custom description</DialogDescription>
```

---

## Testing

### Test with Ad-blocker

1. Install an ad-blocker (uBlock Origin, AdBlock Plus, etc.)
2. Visit the site
3. Modal should appear within 1-2 seconds

### Test without Ad-blocker

1. Disable all ad-blockers
2. Visit the site
3. Modal should NOT appear

### Test Dismissal

1. Trigger the modal
2. Click "Allow ads" or "I understand"
3. Refresh the page
4. Modal should NOT appear again (stored in localStorage)

### Clear localStorage

To test again after dismissing:

```javascript
// In browser console:
localStorage.removeItem("adblock-dismissed");
// Then refresh the page
```

---

## Browser Compatibility

✅ **Chrome/Edge** - Full support  
✅ **Firefox** - Full support  
✅ **Safari** - Full support  
✅ **Opera** - Full support  
✅ **Mobile browsers** - Full support

---

## Ad-blocker Compatibility

✅ **uBlock Origin** - Detected  
✅ **AdBlock Plus** - Detected  
✅ **AdGuard** - Detected  
✅ **Privacy Badger** - Detected  
✅ **Ghostery** - Detected  
✅ **Brave Browser** - Detected (built-in ad-blocker)

---

## Performance

- **Detection Time**: ~1-2 seconds after page load
- **No Performance Impact**: Detection runs asynchronously
- **Minimal Bundle Size**: Uses existing UI components
- **No External Dependencies**: Uses built-in browser APIs

---

## Accessibility

- ✅ Modal is focusable and keyboard accessible
- ✅ Screen reader friendly (ARIA labels)
- ✅ High contrast for visibility
- ✅ Responsive text sizing

---

## Troubleshooting

### Modal not appearing

1. Check browser console for errors
2. Verify ad-blocker is actually active
3. Check if localStorage has `adblock-dismissed: true`
4. Increase detection timeout if needed

### False positives

1. Increase detection threshold (require more methods)
2. Check network conditions (slow connections might trigger false positives)
3. Adjust detection timeouts

### Modal appearing when no ad-blocker

1. Check if browser has built-in ad-blocking (Brave, Opera)
2. Check if corporate firewall is blocking ads
3. Adjust detection sensitivity

---

## Future Enhancements

Possible improvements:

- [ ] A/B testing different messages
- [ ] Analytics tracking (how many users disable ad-blocker)
- [ ] Custom messages per ad-blocker type
- [ ] Progressive disclosure (show more info on click)
- [ ] Whitelist instructions for specific ad-blockers

---

## License

Part of the FreeMediaBuzz project.

