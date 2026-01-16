import express, { Request, Response } from 'express';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

interface GoogleServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface Config {
  title: string;
  description: string;
  imageUrl: string;
  googleSheets: {
    spreadsheetId: string;
    sheetName: string;
    credentials: GoogleServiceAccountCredentials;
  };
  port: number;
}

// Load configuration
const configPath = path.join(__dirname, '..', 'config.json');
let config: Config;

try {
  const configData = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(configData);
} catch (error) {
  console.error('Error loading config.json. Please copy config.example.json to config.json and configure it.');
  process.exit(1);
}

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: config.googleSheets.credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Function to append email to Google Sheet
async function appendEmailToSheet(email: string): Promise<void> {
  const timestamp = new Date().toISOString();
  
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.googleSheets.spreadsheetId,
      range: `${config.googleSheets.sheetName}!A:B`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[email, timestamp]],
      },
    });
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    throw error;
  }
}

// Generate HTML for the page
function generateHTML(message?: string, error?: boolean): string {
  const messageHTML = message
    ? `<div class="message ${error ? 'error' : 'success'}">${message}</div>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 100%;
      overflow: hidden;
    }
    .header-image {
      width: 100%;
      height: auto;
      display: block;
    }
    .content {
      padding: 40px;
    }
    h1 {
      color: #333;
      margin-bottom: 16px;
      font-size: 28px;
    }
    p {
      color: #666;
      margin-bottom: 24px;
      line-height: 1.6;
      font-size: 16px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }
    input[type="email"] {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    input[type="email"]:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .message {
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
  </style>
</head>
<body>
  <div class="container">
    ${config.imageUrl ? `<img src="${config.imageUrl}" alt="Header" class="header-image">` : ''}
    <div class="content">
      <h1>${config.title}</h1>
      <p>${config.description}</p>
      ${messageHTML}
      <form method="POST" action="/subscribe">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            placeholder="your@email.com" 
            required
            autocomplete="email"
          >
        </div>
        <button type="submit">Subscribe</button>
      </form>
    </div>
  </div>
</body>
</html>
  `;
}

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send(generateHTML());
});

app.post('/subscribe', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.send(generateHTML('Please provide a valid email address.', true));
  }

  // Email validation - using a more comprehensive regex pattern
  // This pattern handles most common email formats while avoiding overly complex patterns
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) {
    return res.send(generateHTML('Please provide a valid email address.', true));
  }

  try {
    await appendEmailToSheet(email.trim());
    res.send(generateHTML("Thank you for subscribing! You've been added to our mailing list.", false));
  } catch (error) {
    console.error('Subscription error:', error);
    res.send(generateHTML('An error occurred. Please try again later.', true));
  }
});

// Health check endpoint for Cloud Run
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// Start server
const PORT = process.env.PORT || config.port || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});
