# Email Capture

A minimal web application for capturing email addresses and storing them in Google Sheets. Built with Node.js, TypeScript, and Express with server-side rendering.

## Features

- 🎨 Clean, responsive server-side rendered UI
- 📊 Automatic storage to Google Sheets
- ⚙️ JSON-based configuration
- 🐳 Docker support for Cloud Run deployment
- 🔒 Service account authentication for Google Sheets

## Prerequisites

- Node.js 18+ or Docker
- A Google Cloud project with Sheets API enabled
- A Google Service Account with access to your target spreadsheet

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/tgboyles/emailcapture.git
cd emailcapture
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the application

Copy the example configuration file:

```bash
cp config.example.json config.json
```

Edit `config.json` with your settings:

- **title**: The heading displayed on the page
- **description**: Description text shown to users
- **imageUrl**: URL of the header image (optional)
- **googleSheets.spreadsheetId**: Your Google Sheets ID (from the URL)
- **googleSheets.sheetName**: Name of the sheet tab (e.g., "Emails")
- **googleSheets.credentials**: Your service account credentials JSON
- **port**: Server port (default: 8080)

### 4. Set up Google Sheets

1. Create a new Google Sheet
2. Note the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
3. Create a service account in Google Cloud Console
4. Download the service account JSON credentials
5. Share your Google Sheet with the service account email (found in the credentials JSON)
6. Give the service account "Editor" permissions

### 5. Run the application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The application will be available at `http://localhost:8080`

## Configuration Options

The `config.json` file supports the following options:

```json
{
  "title": "Join Our Mailing List",
  "description": "Sign up to receive updates...",
  "imageUrl": "https://example.com/image.jpg",
  "googleSheets": {
    "spreadsheetId": "YOUR_SPREADSHEET_ID",
    "sheetName": "Emails",
    "credentials": {
      // Service account JSON credentials
    }
  },
  "port": 8080
}
```

## Deploying to Google Cloud Run

### Build and deploy with Docker

1. Build the Docker image:
```bash
docker build -t emailcapture .
```

2. Test locally:
```bash
docker run -p 8080:8080 -v $(pwd)/config.json:/app/config.json emailcapture
```

3. Deploy to Cloud Run:
```bash
# Tag the image for Google Container Registry
docker tag emailcapture gcr.io/YOUR_PROJECT_ID/emailcapture

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/emailcapture

# Deploy to Cloud Run
gcloud run deploy emailcapture \
  --image gcr.io/YOUR_PROJECT_ID/emailcapture \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Note**: You'll need to inject the `config.json` as a secret or environment variable in Cloud Run. Consider using Google Secret Manager for credentials.

### Alternative: Deploy with gcloud

```bash
gcloud run deploy emailcapture \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Project Structure

```
emailcapture/
├── src/
│   └── server.ts          # Main application server
├── config.example.json    # Example configuration
├── config.json            # Your configuration (gitignored)
├── Dockerfile             # Docker configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## API Endpoints

- `GET /` - Main email capture form
- `POST /subscribe` - Form submission endpoint
- `GET /health` - Health check endpoint

## Data Storage

Emails are stored in Google Sheets with the following format:

| Email | Timestamp |
|-------|-----------|
| user@example.com | 2024-01-16T12:00:00.000Z |

## Security Notes

- Never commit `config.json` with real credentials to version control
- Use Google Secret Manager for production deployments
- The service account should have minimal permissions (Sheets Editor only)
- Consider adding rate limiting for production use

## License

ISC
