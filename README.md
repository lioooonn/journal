# Daily Journal Tracker

A beautiful web application to track your daily progress toward your New Year's resolutions. Enter journal entries each day and view your statistics and progress over time.

## Features

### Daily Entry Form
- **Daily Activity**: Track activities (Gym, Sport, Run, Bike, Pushups, Sit-ups) with duration/amount
- **Custom Activities**: “Other” option lets you name a custom activity
- **Sugar Consumption**: Log daily sugar intake in grams
- **Snacks**: Count number of snacks eaten
- **Sleep Tracking**: Record sleep and wake times
- **Study/Homework**: Checkbox with optional study duration
- **Social Media Usage**: Track time spent on social media
- **Water Intake**: Checkbox for completing water bottle goal (2x)
- **Work/Volunteer**: Track work days (+$45 each) and volunteer hours

### Progress Dashboard
- **Overall Statistics**: View totals and averages across all entries
- **Activity Breakdown**: Visual chart showing activity frequency
- **Recent Entries**: Browse your latest journal entries
- **Key Metrics**: Study days, water goal completion, average sleep, sugar, and snacks
- **Earnings & Volunteering**: Work day count, total earned, volunteer days/hours

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Open your browser and go to: `http://localhost:3000`
   - Use the navigation to switch between "New Entry" and "View Progress"

## Project Structure

```
journal/
├── server.js          # Express server and API routes
├── database.js        # SQLite database setup and queries
├── package.json       # Dependencies and scripts
├── public/           # Frontend files
│   ├── index.html    # Entry form page
│   ├── progress.html # Statistics dashboard
│   ├── entry.js      # Entry form logic
│   ├── progress.js   # Dashboard logic
│   └── styles.css    # Styling
└── journal.db        # SQLite database (created automatically)
```

## API Endpoints

- `POST /api/entries` - Create a new journal entry
- `GET /api/entries` - Get all journal entries
- `GET /api/stats` - Get aggregated statistics

## Database

The application uses SQLite for data storage. The database file (`journal.db`) is created automatically on first run. All entries are stored with timestamps and can be queried for statistics.

## Technologies Used

- **Backend**: Node.js, Express
- **Database**: SQLite3
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Modern CSS with gradients and animations

## Deployment

This application requires a Node.js hosting service (not GitHub Pages, which only serves static files).

### Deploy to Render (Free)

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `lioooonn/journal`
4. Configure:
   - **Name**: journal-tracker (or any name)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click "Create Web Service"
6. Your app will be live at `https://journal-tracker.onrender.com` (or your custom domain)

The SQLite database will persist on Render's disk. Note: Free tier services may spin down after inactivity.

### Deploy to Railway (Free)

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `journal` repository
4. Railway will auto-detect Node.js and deploy
5. Your app will be live at a Railway-provided URL

### Deploy to Fly.io (Free)

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run: `fly launch`
3. Follow the prompts to deploy

## Notes

- Admin routes: POST/PUT/DELETE require an admin token obtained via `/login` (default password `admin123`, override with `ADMIN_PASSWORD` environment variable).
- Only admins can create, edit, or delete entries; anyone can view progress.
- The date field defaults to today and prevents future dates
- All fields except date are optional
- Statistics are calculated from all entries in the database
- The progress page shows the 10 most recent entries
- **GitHub Pages cannot host this app** - it requires a Node.js server and database