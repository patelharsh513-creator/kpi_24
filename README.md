
# Live Logistics Operations Dashboard

An AI-powered dashboard for tracking logistics kpis, dispatching costs, and operational efficiency.

## 🚀 How to Connect & Deploy to GitHub

This project is pre-configured with a GitHub Actions workflow (`.github/workflows/main.yml`) to automatically deploy your app to GitHub Pages.

### 1. Initialize Git (If working locally)

If you haven't initialized a repository yet, run:

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Push to GitHub

1.  Create a **new repository** on GitHub.
2.  Run the commands provided by GitHub to push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 3. Configure the API Key (Crucial)

If you see "API Key is missing" in your deployed app, you need to add your key to GitHub Secrets:

1.  Go to your repository on GitHub.
2.  Click **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret**.
4.  **Name**: `API_KEY`
5.  **Secret**: Paste your Google Gemini API key.
6.  Click **Add secret**.
7.  **Re-run the workflow**: Go to the **Actions** tab, click on the latest workflow, and try re-running it, or push a small change to trigger a new build.

### 4. View Your App

After pushing, click the **Actions** tab in your repository to watch the deployment. Once green, your app will be live at:

`https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## 🛠 Local Development

To run the app locally:

```bash
npm install
npm run dev
```

## Troubleshooting

-   **Charts not showing?** Ensure your window is wide enough or try refreshing. The charts need real data or explicit zeroes to render.
-   **API Key Missing:** If running locally, create a `.env` file with `VITE_API_KEY=your_key_here`. If on GitHub, follow step 3 above.