# Personal Finance Dashboard

A client-side Single Page Application (SPA) built with React, Vite, and TypeScript, designed to help you visualize and analyze your financial data from Google Sheets using Gemini AI.

## 🚀 Deployment to GitHub Pages

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

### Setting up the Repository

1. **Push to Main**: Ensure your code is pushed to the `main` (or `master`) branch.
2. **GitHub Actions**: The workflow defined in `.github/workflows/deploy.yml` will automatically trigger. It builds the application and pushes the artifacts to a `gh-pages` branch.
3. **Configure GitHub Pages**:
   - Go to your repository's **Settings**.
   - Click on **Pages** in the left sidebar.
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Under **Branch**, select `gh-pages` and `/ (root)`.
   - Click **Save**.

### Important: Base Path Configuration
The application is configured with a base path of `/personal-finance/` in `app/vite.config.ts`.
**If your repository name is NOT `personal-finance`, you must update this:**

1. Open `app/vite.config.ts`.
2. Change the `base` property to match your repository name:
   ```typescript
   base: '/<your-repo-name>/',
   ```
3. Push the change.

Once configured, your app will be live at `https://<your-username>.github.io/<your-repo-name>/`.

## 📖 How to Use

This application is designed to be privacy-focused and runs entirely in your browser. No data is stored on any server other than your own Google Sheets (via Google's APIs).

### Prerequisites
You will need:
1. **Google Client ID**: To authenticate and access your Google Sheets.
   - Create credentials in the [Google Cloud Console](https://console.cloud.google.com/).
   - Enable the **Google Sheets API**.
2. **Gemini API Key**: To enable AI-powered financial analysis.
   - Get an API key from [Google AI Studio](https://aistudio.google.com/).
3. **Google Sheets**:
   - **Financial Planning Sheet**: A structured sheet for budgeting (Category -> Sub-Category -> Metric).
   - **Portfolio Sheet**: A flat table for tracking investments.

### Interaction
1. Open the deployed application URL.
2. You will be prompted to enter your **Google Client ID** and **Gemini API Key**.
   - *Note: These keys are stored temporarily in your browser's Session Storage for the duration of your session and are cleared when you close the tab.*
3. Enter the **Sheet IDs** for your Financial Planning and Portfolio sheets.
4. Sign in with your Google Account when prompted to allow the app to read your sheets.
5. Explore your dashboard, view Monte Carlo simulations, and ask questions to the AI analyst.

## 💻 Local Development

To run the project locally:

1. Navigate to the app directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
