import yfinance as yf
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import warnings

warnings.filterwarnings('ignore')

app = FastAPI(title="Stock Technical Analysis API")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    ticker: str = "IBIT"
    period: str = "1y"
    interval: str = "1d"

def calculate_rsi(data: pd.Series, period: int = 14) -> pd.Series:
    delta = data.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(data: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    ema_fast = data.ewm(span=fast, adjust=False).mean()
    ema_slow = data.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram

@app.get("/analyze")
async def analyze(ticker: str = "IBIT", period: str = "1y", interval: str = "1d"):
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period, interval=interval)
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {ticker}")

        # Basic Indicators
        df['RSI'] = calculate_rsi(df['Close'])
        df['MACD'], df['Signal'], df['Histogram'] = calculate_macd(df['Close'])
        df['SMA_50'] = df['Close'].rolling(window=50).mean()
        df['SMA_200'] = df['Close'].rolling(window=200).mean()

        # Fibonacci
        max_price = df['Close'].max()
        min_price = df['Close'].min()
        max_date = df['Close'].idxmax()
        min_date = df['Close'].idxmin()
        
        trend_direction = "UPTREND" if min_date < max_date else "DOWNTREND"
        diff = max_price - min_price
        fib_levels = {
            '0%': round(max_price, 2),
            '23.6%': round(max_price - (diff * 0.236), 2),
            '38.2%': round(max_price - (diff * 0.382), 2),
            '50%': round(max_price - (diff * 0.500), 2),
            '61.8%': round(max_price - (diff * 0.618), 2),
            '78.6%': round(max_price - (diff * 0.786), 2),
            '100%': round(min_price, 2)
        }

        # Prepare for JSON response
        result_df = df.tail(100).copy()
        result_df.index = result_df.index.strftime('%Y-%m-%d %H:%M:%S')
        
        history = []
        for index, row in result_df.iterrows():
            history.append({
                "date": index,
                "open": round(row['Open'], 2),
                "high": round(row['High'], 2),
                "low": round(row['Low'], 2),
                "close": round(row['Close'], 2),
                "rsi": round(row['RSI'], 2) if not np.isnan(row['RSI']) else None,
                "macd": round(row['MACD'], 4) if not np.isnan(row['MACD']) else None,
                "signal": round(row['Signal'], 4) if not np.isnan(row['Signal']) else None,
                "histogram": round(row['Histogram'], 4) if not np.isnan(row['Histogram']) else None,
                "sma50": round(row['SMA_50'], 2) if not np.isnan(row['SMA_50']) else None,
                "sma200": round(row['SMA_200'], 2) if not np.isnan(row['SMA_200']) else None,
            })

        # Signal Analysis logic from notebook
        latest_rsi = df['RSI'].iloc[-1]
        latest_macd = df['MACD'].iloc[-1]
        latest_signal = df['Signal'].iloc[-1]
        latest_hist = df['Histogram'].iloc[-1]
        prev_hist = df['Histogram'].iloc[-2]

        # RSI Analysis
        if latest_rsi < 30:
            rsi_sig, rsi_score = "OVERSOLD - Potential BUY signal", 1
        elif latest_rsi > 70:
            rsi_sig, rsi_score = "OVERBOUGHT - Potential SELL signal", -1
        elif latest_rsi < 40:
            rsi_sig, rsi_score = "Approaching oversold - Cautiously bullish", 0.5
        elif latest_rsi > 60:
            rsi_sig, rsi_score = "Approaching overbought - Cautiously bearish", -0.5
        else:
            rsi_sig, rsi_score = "NEUTRAL - No strong signal", 0

        # MACD Analysis
        if latest_macd > latest_signal and prev_hist < 0 and latest_hist > 0:
            macd_sig, macd_score = "BULLISH CROSSOVER - Strong BUY signal", 1
        elif latest_macd < latest_signal and prev_hist > 0 and latest_hist < 0:
            macd_sig, macd_score = "BEARISH CROSSOVER - Strong SELL signal", -1
        elif latest_macd > latest_signal:
            macd_sig, macd_score = "MACD above signal - Bullish momentum", 0.5
        elif latest_macd < latest_signal:
            macd_sig, macd_score = "MACD below signal - Bearish momentum", -0.5
        else:
            macd_sig, macd_score = "NEUTRAL - No clear signal", 0

        # Fibonacci Analysis
        tolerance = df['Close'].iloc[-1] * 0.02
        fib_score = 0
        if trend_direction == "UPTREND":
            if abs(df['Close'].iloc[-1] - fib_levels['38.2%']) < tolerance:
                fib_sig, fib_score = "Near 38.2% support - STRONG BUY zone", 1
            elif abs(df['Close'].iloc[-1] - fib_levels['50%']) < tolerance:
                fib_sig, fib_score = "Near 50% support - BUY zone", 0.75
            elif abs(df['Close'].iloc[-1] - fib_levels['61.8%']) < tolerance:
                fib_sig, fib_score = "Near 61.8% (Golden Ratio) support - CRITICAL BUY zone", 1
            elif df['Close'].iloc[-1] > fib_levels['23.6%']:
                fib_sig, fib_score = "Above 23.6% - Strong uptrend continuation", 0.5
            elif df['Close'].iloc[-1] < fib_levels['61.8%']:
                fib_sig, fib_score = "Below 61.8% - Weak support, caution", -0.5
            else:
                fib_sig, fib_score = "Between support levels - NEUTRAL", 0
        else:
            if abs(df['Close'].iloc[-1] - fib_levels['38.2%']) < tolerance:
                fib_sig, fib_score = "Near 38.2% resistance - STRONG SELL zone", -1
            elif abs(df['Close'].iloc[-1] - fib_levels['50%']) < tolerance:
                fib_sig, fib_score = "Near 50% resistance - SELL zone", -0.75
            elif abs(df['Close'].iloc[-1] - fib_levels['61.8%']) < tolerance:
                fib_sig, fib_score = "Near 61.8% (Golden Ratio) resistance - CRITICAL SELL zone", -1
            elif df['Close'].iloc[-1] < fib_levels['61.8%']:
                fib_sig, fib_score = "Below 61.8% - Strong downtrend continuation", -0.5
            elif df['Close'].iloc[-1] > fib_levels['38.2%']:
                fib_sig, fib_score = "Above 38.2% - Weak resistance, possible reversal", 0.5
            else:
                fib_sig, fib_score = "Between resistance levels - NEUTRAL", 0

        # Recommendation
        total_score = rsi_score + macd_score + fib_score
        if total_score >= 2:
            rec, expl = "🟢 STRONG BUY", "RSI, MACD, and Fibonacci indicators are showing strong bullish signals."
        elif total_score >= 1:
            rec, expl = "🟢 BUY", "Indicators are leaning bullish. Consider entering a position."
        elif total_score >= 0.5:
            rec, expl = "🟡 LEAN BUY", "Slightly bullish signals. Wait for confirmation or enter with caution."
        elif total_score <= -2:
            rec, expl = "🔴 STRONG SELL", "RSI, MACD, and Fibonacci indicators are showing strong bearish signals."
        elif total_score <= -1:
            rec, expl = "🔴 SELL", "Indicators are leaning bearish. Consider taking profits or exiting."
        elif total_score <= -0.5:
            rec, expl = "🟡 LEAN SELL", "Slightly bearish signals. Consider reducing position or wait for confirmation."
        else:
            rec, expl = "🟡 HOLD", "Mixed or neutral signals. Wait for clearer indicators before acting."

        return {
            "ticker": ticker,
            "current_price": round(df['Close'].iloc[-1], 2),
            "trend": trend_direction,
            "fib_levels": fib_levels,
            "history": history,
            "analysis": {
                "rsi": {"value": round(latest_rsi, 2), "signal": rsi_sig, "score": rsi_score},
                "macd": {"value": round(latest_macd, 4), "signal": macd_sig, "score": macd_score},
                "fibonacci": {"signal": fib_sig, "score": fib_score},
                "total_score": round(total_score, 2)
            },
            "recommendation": {
                "label": rec,
                "explanation": expl
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
