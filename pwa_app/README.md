# Receipt Scanner PWA

A Progressive Web App (PWA) for scanning and analyzing receipts using AI-powered OCR technology. This app connects to your FastAPI backend for receipt processing.

## Features

- 📱 **Mobile-First Design** - Optimized for mobile devices
- 📷 **Camera Integration** - Take photos directly from the app
- 🖼️ **Gallery Selection** - Choose images from your device
- 🔄 **Drag & Drop** - Upload images by dragging and dropping

- 📋 **Receipt History** - View all saved receipts in a dedicated tab
- 👁️ **Receipt Details** - View detailed information for each saved receipt
- 🗑️ **Delete Receipts** - Remove receipts from the database
- ⚡ **Offline Support** - Works offline with cached content
- 🎨 **Modern UI** - Clean, responsive design with dark mode support
- 📊 **Real-time Analysis** - Instant receipt analysis results
- 🔔 **Push Notifications** - Get notified when analysis is complete

## Quick Start

### 1. Prerequisites

- Your FastAPI backend running on `http://127.0.0.1:8000`
- A modern web browser (Chrome, Firefox, Safari, Edge)
- HTTPS for production deployment (required for PWA features)

### 2. Setup

1. **Clone or download** the PWA files to your web server
2. **Update API URL** in `app.js` if your backend is on a different URL:
   ```javascript
   this.apiUrl = "http://127.0.0.1:8000"; // Change this to your API URL
   ```
3. **Serve the files** using a web server

### 3. Local Development

#### Using Python (Simple)

```bash
cd pwa_app
python -m http.server 8080
```

Then visit `http://localhost:8080`

#### Using Node.js

```bash
cd pwa_app
npx serve .
```

#### Using PHP

```bash
cd pwa_app
php -S localhost:8080
```

## Installation on Mobile

### Android (Chrome)

1. Open the PWA in Chrome
2. Tap the menu (⋮) → "Add to Home Screen"
3. Tap "Add"
4. The app will appear on your home screen

### iOS (Safari)

1. Open the PWA in Safari
2. Tap the share button (□↑)
3. Tap "Add to Home Screen"
4. Tap "Add"
5. The app will appear on your home screen

## File Structure

```
pwa_app/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── app.js              # Main JavaScript application
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── icons/             # App icons (create this folder)
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
├── screenshots/        # App screenshots (optional)
│   ├── mobile-1.png
│   └── mobile-2.png
└── README.md          # This file
```

## API Integration

The PWA connects to your FastAPI backend with these endpoints:

### Required Endpoints

1. **POST /analyze/upload** - Upload and analyze receipt

   ```javascript
   // Example request
   const formData = new FormData();
   formData.append("file", imageFile);

   const response = await fetch("http://127.0.0.1:8000/analyze/upload", {
     method: "POST",
     body: formData,
   });
   ```

2. **POST /receipts/save** - Save receipt data to database

   ```javascript
   // Example request
   const response = await fetch("http://127.0.0.1:8000/receipts/save", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(receiptData),
   });
   ```

3. **GET /receipts** - Get all saved receipts

   ```javascript
   // Example request
   const response = await fetch("http://127.0.0.1:8000/receipts");
   ```

4. **GET /receipts/{id}** - Get specific receipt by ID

   ```javascript
   // Example request
   const response = await fetch("http://127.0.0.1:8000/receipts/receipt-id");
   ```

5. **DELETE /receipts/{id}** - Delete receipt by ID

   ```javascript
   // Example request
   const response = await fetch("http://127.0.0.1:8000/receipts/receipt-id", {
     method: "DELETE",
   });
   ```

6. **GET /health** - Health check (optional)
   ```javascript
   // Used for connectivity check
   fetch("http://127.0.0.1:8000/health");
   ```

### Expected Response Format

```json
{
  "id": "receipt-123",
  "merchant_name": "Walmart",
  "transaction_date": "2023-12-01T10:30:00",
  "total": 45.67,
  "subtotal": 42.5,
  "tax": 3.17,
  "tip": 0.0,
  "confidence_score": 0.95,
  "items": [
    {
      "description": "Milk",
      "quantity": 2,
      "unit_price": 3.99,
      "total_price": 7.98
    }
  ]
}
```

## Configuration

### API URL

Update the API URL in `app.js`:

```javascript
this.apiUrl = "http://127.0.0.1:8000"; // Change to your API URL
```

### App Metadata

Update the app metadata in `manifest.json`:

```json
{
  "name": "Receipt Scanner",
  "short_name": "ReceiptScan",
  "description": "Scan and analyze receipts with AI-powered OCR technology"
}
```

### Icons

Create app icons in the `icons/` folder with these sizes:

- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

## Deployment

### GitHub Pages (Free)

1. Create a GitHub repository
2. Upload the PWA files
3. Go to Settings → Pages
4. Select source branch
5. Your PWA will be available at `https://username.github.io/repository-name`

### Netlify (Free)

1. Drag and drop the `pwa_app` folder to [Netlify](https://netlify.com)
2. Your PWA will be deployed automatically
3. Custom domain can be added

### Vercel (Free)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the `pwa_app` folder
3. Follow the prompts

### Custom Server

Upload the files to any web server with HTTPS support.

## Browser Support

- ✅ Chrome 67+
- ✅ Firefox 67+
- ✅ Safari 11.1+
- ✅ Edge 79+

## PWA Features

### ✅ Implemented

- [x] Responsive design
- [x] Camera access
- [x] File upload
- [x] Offline caching
- [x] Service Worker
- [x] Web App Manifest
- [x] Install prompt
- [x] Push notifications (framework)
- [x] Background sync (framework)

### 🔄 Future Enhancements

- [ ] IndexedDB for offline storage
- [ ] Background sync for offline uploads
- [ ] Push notifications for analysis completion
- [ ] Receipt history
- [ ] Export functionality
- [ ] Multiple language support

## Troubleshooting

### Camera Not Working

- Ensure you're using HTTPS (required for camera access)
- Check browser permissions
- Try refreshing the page

### API Connection Issues

- Verify your FastAPI backend is running
- Check the API URL in `app.js`
- Ensure CORS is configured on your backend

### PWA Not Installing

- Check that all required files are present
- Verify the manifest.json is valid
- Ensure HTTPS is enabled

### Offline Not Working

- Check that the Service Worker is registered
- Verify cache files are being served
- Clear browser cache and try again

## Development

### Adding New Features

1. Update `app.js` for new functionality
2. Add corresponding styles in `styles.css`
3. Update `manifest.json` if needed
4. Test on multiple devices

### Debugging

- Use Chrome DevTools → Application tab for PWA debugging
- Check Service Worker in DevTools → Application → Service Workers
- Monitor network requests in DevTools → Network

## Security Considerations

- Always use HTTPS in production
- Validate file uploads on the server
- Implement proper CORS policies
- Sanitize user inputs
- Use secure API endpoints

## Performance Tips

- Optimize images before upload
- Use appropriate cache strategies
- Minimize JavaScript bundle size
- Enable compression on your server
- Use CDN for external resources

## License

This PWA is provided as-is for educational and development purposes.

## Support

For issues or questions:

1. Check the troubleshooting section
2. Verify your FastAPI backend is working
3. Test with different browsers
4. Check browser console for errors

---

**Note**: This PWA requires your FastAPI backend to be running and accessible for full functionality.
