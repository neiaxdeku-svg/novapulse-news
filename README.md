# NovaPulse — Autonomous Tech & AI News Radar

An autonomous, self-updating live news portal tracking Artificial Intelligence, Software Engineering, Startups, Hardware, and Cybersecurity.

## Features

- ⚡ **Autonomous Live Feed**: Fetches directly from Dev Community, Hacker News, Reddit (`r/artificial`, `r/technology`), and TechCrunch.
- 🤖 **Automated Scheduled Curator**: Built-in GitHub Actions cron workflow (`.github/workflows/update-news.yml`) that runs every 6 hours to fetch fresh stories and commit updates without manual effort.
- 🎯 **Category Radar**: Filter by AI & Neural Nets, Software & Code, Startups & VC, Cybersecurity, and Hardware.
- 📖 **Distraction-Free Reader Mode**: Clean modal reader with full title, summary, key metadata, and direct source link.
- 🔖 **Saved Stories**: Save bookmarks stored locally in the browser.
- 🌓 **Theme Toggle**: Light and Dark mode with persistence.
- 🚀 **100% Free Hosting Ready**: Pre-configured for zero-config deployment on Vercel or Netlify.

---

## How to Deploy for Free (Vercel or Netlify)

### Step 1: Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new) and create a new repository named `novapulse-news` (choose **Public**).
2. Do **not** initialize with README or .gitignore (we already have them).

### Step 2: Push Your Code from Termux
Run the following commands in Termux (replace `YOUR_USERNAME` with your GitHub username):

```bash
cd /data/user/0/com.termux/files/home/projects/novapulse-news
git remote add origin https://github.com/YOUR_USERNAME/novapulse-news.git
git push -u origin main
```
*(When prompted for password, use your GitHub **Personal Access Token**).*

### Step 3: Deploy in 10 Seconds

#### Option A: Deploy to Vercel (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **Import** next to your `novapulse-news` repository.
3. Click **Deploy** (no build settings need to be changed).
4. Done! Your site is live at `https://novapulse-news.vercel.app`!

#### Option B: Deploy to Netlify
1. Go to [app.netlify.com/start](https://app.netlify.com/start).
2. Choose **GitHub** and select `novapulse-news`.
3. Click **Deploy Site**.
4. Done! Your site is live at `https://your-site-name.netlify.app`!

---

## Autonomous Maintenance

Once deployed, you never have to manually update the site:
1. Every 6 hours, GitHub Actions will automatically run `scripts/fetch-news.mjs`.
2. Fresh headlines are saved into `data/news.json` and committed.
3. Vercel / Netlify will automatically detect the commit and redeploy in seconds!
