# Daily Journal Tracker

A beautiful web application to track your daily progress toward your New Year's resolutions. Enter journal entries each day and view your statistics and progress over time.

## Features

### Daily Entry Form
- **Daily Activity**: Track activities (Gym, Sport, Run, Bike, Pushups, Sit-ups) with duration/amount
- **Sugar Consumption**: Log daily sugar intake in grams
- **Snacks**: Count number of snacks eaten
- **Sleep Tracking**: Record sleep and wake times
- **Study/Homework**: Checkbox with optional study duration
- **Social Media Usage**: Track time spent on social media
- **Water Intake**: Checkbox for completing water bottle goal (2x)

### Progress Dashboard
- **Overall Statistics**: View totals and averages across all entries
- **Activity Breakdown**: Visual chart showing activity frequency
- **Recent Entries**: Browse your latest journal entries
- **Key Metrics**: Study days, water goal completion, average sleep, sugar, and snacks

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

## Notes

- The date field defaults to today and prevents future dates
- All fields except date are optional
- Statistics are calculated from all entries in the database
- The progress page shows the 10 most recent entries
