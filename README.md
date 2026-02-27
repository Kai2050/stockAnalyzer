# Stock Technical Analysis Dashboard

A modern, high-density stock analysis tool built with FastAPI and React. This dashboard provides real-time technical analysis including RSI, MACD, and Fibonacci levels, along with a custom-weighted trading recommendation.

## Features
- **Interactive Charts**: Price Action (with SMA 50/200), RSI, and MACD.
- **Signal Analysis**: Compact breakdown of technical indicators and their scores.
- **Final Recommendation**: Aggregated score-based trading advice (BUY/HOLD/SELL).
- **Premium UI**: Dark mode dashboard with glassmorphism and modern typography.

---

## Prerequisites

Ensure you have the following installed on your macOS:
- **Node.js**: v20 or higher (v24.14.0 recommended)
- **Python**: v3.9 or higher
- **NVM** (Node Version Manager): Recommended for managing Node versions.

---

## Running the Application

Follow these steps to get the application running locally:

### 1. Start the Backend API

1. Open a new terminal window at the project root (`/Users/nik/scripts/stock_anlayzer`).
2. Create and activate the virtual environment (if not already done):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend server:
   ```bash
   python -m uvicorn app:app --reload
   ```
   *The backend will be available at `http://localhost:8000`.*

### 2. Start the Frontend

1. Open a **second terminal window** in the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

### 3. Usage

1. Open your browser and navigate to `http://localhost:5173`.
2. Enter a stock ticker (e.g., `AAPL`, `TSLA`, `IBIT`) in the search bar.
3. Click **Analyze** to generate the technical dashboard.

---

## Project Structure

```bash
.
├── app.py                # FastAPI backend server
├── requirements.txt      # Python dependencies
├── venv/                 # Python virtual environment
├── stock_analyzer.ipynb  # Original research notebook
└── frontend/             # React application source code
    ├── src/              # React components and logic
    ├── tailwind.config.js # Tailwind CSS 4.0 config
    └── index.css         # Global styles and Tailwind directives
```
