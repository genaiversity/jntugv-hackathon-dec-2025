# Automated Gap Analysis Watch System

This system automatically regenerates gap analysis whenever `jobs.json` is updated.

## How It Works

1. **Watch Script** (`watch-and-update.js`) monitors `data/jobs.json`
2. When changes are detected, it automatically:
   - Runs `python main.py` to regenerate gap analysis
   - Copies generated `gap_analysis_*.json` files to `Frontend/public/`
   - Frontend automatically displays updated recommendations

## Getting Started

### 1. Start the Watch System

```bash
cd RAG_System
npm run watch
```

You should see:

```
🔍 Starting watch for jobs.json changes...
📁 Watching: ../data/jobs.json
📊 Will generate: ./gap_analysis_*.json
📤 Will copy to: ../Frontend/public/
```

### 2. Make Changes to jobs.json

Edit `data/jobs.json` and save. The watch system will:

- Detect the change (within 2 seconds)
- Run Python gap analysis
- Update the Frontend automatically

### 3. View Updates in Frontend

Simply refresh your browser to see the updated recommendations. No rebuild needed!

## What the Watch Script Does

```
jobs.json changes
        ↓
    Watch detects change
        ↓
    Run: python main.py
        ↓
    Generates: gap_analysis_1.json, gap_analysis_2.json, etc.
        ↓
    Copy to: Frontend/public/
        ↓
    Frontend loads automatically on page refresh
```

## Manual Operations

If you want to manually run the processes:

```bash
# Just run Python analysis
npm run python

# Or manually run from RAG_System directory
python main.py

# Then manually copy results
copy gap_analysis_1.json ..\Frontend\public\
```

## Troubleshooting

### Watch not detecting changes?

- Make sure you save the file (not just edit it)
- Check that `data/jobs.json` path exists
- Try restarting the watch script

### Python script fails?

- Check console output for Python errors
- Verify `GOOGLE_API_KEY` environment variable is set
- Ensure Python environment is properly configured

### Files not copying to Frontend?

- Verify `Frontend/public/` directory exists
- Check file permissions
- Look at console output for specific errors

## Development Notes

- Watch waits 2 seconds after file change before running (for file stability)
- Only one Python script runs at a time (prevents overlapping executions)
- Frontend automatically detects new gap_analysis files on reload
- No server needed - all files are static
