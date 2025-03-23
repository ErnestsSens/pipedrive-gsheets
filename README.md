# Pipedrive to Google Sheets Integration

This project allows you to fetch deals from Pipedrive and export them to Google Sheets.

## Installation

1. Clone the repository
2. Run `npm install`
3. Create a `.env` file using `.env.example` as a template

## Pipedrive Configuration

1. Get your Pipedrive API key from your Pipedrive account
2. Fill in the `.env` file with your API key

## Google Sheets Configuration

1. Create a project on [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Sheets API for this project
3. Create a service account: "IAM & Admin" > "Service Accounts"
4. Create and download a JSON key for this service account
5. Save the JSON file as `service-account.json` in your project root directory
6. Create a new Google Sheet
7. Share it with the service account email (with Editor permissions)
8. Get the Google Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
9. Update your `.env` file with the Sheet ID

## Filter Options

You can set the following filters in your `.env` file:

- `FILTER_STATUS` - deal status (open, won, lost, deleted)
- `FILTER_USER_ID` - user ID
- `FILTER_STAGE_ID` - deal stage ID
- `FILTER_SINCE` - start date (YYYY-MM-DD format)
- `FILTER_UNTIL` - end date (YYYY-MM-DD format)

## Usage

Run `npm start` to fetch deals and export them to Google Sheets.

## Data Retention Policy

**Important:** This script completely clears the Google Sheet before writing new data. Each run will replace all existing data with the latest deals from Pipedrive.

## Scheduling

To run this script automatically on a schedule:

### On Linux/macOS (using cron):
```bash
# Edit crontab
crontab -e

# Add line to run daily at 6 AM
0 6 * * * cd /path/to/project && /usr/bin/node index.js >> /path/to/logfile.log 2>&1
```

### On Windows (using Task Scheduler):
1. Open Task Scheduler
2. Create a new Basic Task
3. Set the trigger (e.g., daily)
4. Set the action to "Start a program"
5. Program/script: `node`
6. Add arguments: `index.js`
7. Start in: `C:\path\to\your\project\directory`

## Rate Limits

Pipedrive has API rate limits of 1000-2000 requests per hour depending on your plan. This script implements a small delay between requests to help manage these limits.

## Troubleshooting

### Google Sheets API not enabled
Error: `Google Sheets API has not been used in project... or it is disabled`
Solution: Visit the URL in the error message to enable the API, then wait a few minutes before retrying.

### Authentication errors
Error: `Error saving to Google Sheets: No credentials...`
Solution: Make sure your `service-account.json` file is in the root directory and referenced correctly in your `.env` file.

### Permission errors
Error: `Error saving to Google Sheets: The caller does not have permission`
Solution: Ensure you've shared your Google Sheet with the service account email with Editor permissions. 