# Pipedrive API Integration

This Node.js application connects to the Pipedrive API to fetch and display deals.

## Setup

1. Install dependencies:
```
npm install
```

2. Configure environment variables:
   - Create a `.env` file in the root directory with the following variables:
   ```
   API_KEY=your_pipedrive_api_key
   BASE_URL=https://api.pipedrive.com/v1
   ```

## Running the application

```
npm start
```

The application will fetch deals from Pipedrive and display their details in the console. 