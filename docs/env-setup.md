# Environment Variables Setup

This document explains how to set up environment variables for the Finance Tracker application.

## Setting up the Finnhub API Key

### 1. Get a Finnhub API Key

1. Go to [Finnhub.io](https://finnhub.io/)
2. Sign up for a free account
3. Navigate to your dashboard
4. Copy your API key

### 2. Create or Edit the `.env` File

Create a file named `.env` in the root directory of the project (same level as `package.json`).

Add the following content to the file:

```
# MongoDB settings
VITE_MONGODB_URI=mongodb://localhost:27017/finance-tracker
VITE_MONGODB_DBNAME=finance-tracker

# Finnhub API Key - replace with your actual API key
VITE_FINNHUB_API_KEY=your_actual_finnhub_api_key_here
```

Replace `your_actual_finnhub_api_key_here` with the API key you obtained from Finnhub.

### 3. Important Notes

- The `VITE_` prefix is required for all environment variables that need to be accessible in the browser
- The `.env` file should never be committed to version control
- If you're using Git, make sure `.env` is listed in your `.gitignore` file
- After changing the `.env` file, you need to restart the development server

## Troubleshooting

If you see errors like:

- "Missing required environment variables: VITE_FINNHUB_API_KEY"
- "401 Unauthorized" errors when making API requests

Check that:

1. Your `.env` file exists in the root directory
2. The environment variables have the `VITE_` prefix
3. You've restarted the development server after creating/editing the `.env` file
4. Your API key is correct and active

## Production Deployment

For production deployment, you'll need to set these environment variables in your hosting platform's dashboard or configuration.

Different platforms have different ways to set environment variables:

- **Vercel**: Use the Environment Variables section in your project settings
- **Netlify**: Use the Environment Variables section in your site settings
- **Heroku**: Use the Config Vars in your app settings