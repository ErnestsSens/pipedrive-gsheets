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