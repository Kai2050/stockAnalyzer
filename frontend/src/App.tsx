import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Area, Bar, Legend, ReferenceLine
} from 'recharts';
import { Search, TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';

interface HistoryItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  rsi: number | null;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
  sma50: number | null;
  sma200: number | null;
}

interface AnalysisData {
  ticker: string;
  current_price: number;
  trend: 'UPTREND' | 'DOWNTREND';
  fib_levels: Record<string, number>;
  history: HistoryItem[];
  analysis: {
    rsi: { value: number; signal: string; score: number };
    macd: { value: number; signal: string; score: number };
    fibonacci: { signal: string; score: number };
    total_score: number;
  };
  recommendation: {
    label: string;
    explanation: string;
  };
}

function App() {
  const [ticker, setTicker] = useState('IBIT');
  const [period, setPeriod] = useState('1y');
  const [interval, setInterval] = useState('1d');
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/analyze?ticker=${ticker}&period=${period}&interval=${interval}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch data');
      }
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getScoreColor = (score: number) => {
    if (score > 0) return 'text-emerald-400';
    if (score < 0) return 'text-rose-400';
    return 'text-slate-400';
  };

  return (
    <div className="min-h-screen py-4 md:py-8">
      {/* Header & Controls */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Stock Technical Analysis
          </h1>
          <p className="text-sm text-slate-400">RSI, MACD & Fibonacci Retracement</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="e.g. AAPL"
              className="input-field pl-10 w-full"
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            />
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input-field">
            {['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={interval} onChange={(e) => setInterval(e.target.value)} className="input-field">
            {['1h', '1d', '1wk', '1mo'].map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <button onClick={fetchData} className="btn-primary" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </header>

      {error && (
        <div className="glass-card p-4 mb-8 border-red-500/50 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Final Recommendation */}
          <div className="glass-card p-8 border-indigo-500/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">9. Final Recommendation</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div>
                  <div className="text-4xl font-bold mb-2">{data.recommendation.label}</div>
                  <p className="text-lg text-slate-300 max-w-2xl">{data.recommendation.explanation}</p>
                </div>
                <div className="md:ml-auto text-right">
                  <p className="text-slate-400 text-sm mb-1">Signal Score</p>
                  <p className="text-3xl font-bold text-indigo-400">{data.analysis.total_score.toFixed(2)} <span className="text-slate-600 text-lg">/ 3.0</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Signal Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">8. Signal Analysis</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <p className="font-semibold text-indigo-400 whitespace-nowrap">RSI Analysis</p>
                    <span className="text-slate-400 shrink-0">—</span>
                    <span className="text-slate-300 truncate">{data.analysis.rsi.signal}</span>
                  </div>
                  <div className={`font-mono font-bold shrink-0 ml-4 ${getScoreColor(data.analysis.rsi.score)}`}>
                    {data.analysis.rsi.score > 0 ? '+' : ''}{data.analysis.rsi.score.toFixed(2)}
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <p className="font-semibold text-purple-400 whitespace-nowrap">MACD Analysis</p>
                    <span className="text-slate-400 shrink-0">—</span>
                    <span className="text-slate-300 truncate">{data.analysis.macd.signal}</span>
                  </div>
                  <div className={`font-mono font-bold shrink-0 ml-4 ${getScoreColor(data.analysis.macd.score)}`}>
                    {data.analysis.macd.score > 0 ? '+' : ''}{data.analysis.macd.score.toFixed(2)}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <p className="font-semibold text-amber-400 whitespace-nowrap">Fibonacci Analysis</p>
                    <span className="text-slate-400 shrink-0">—</span>
                    <span className="text-slate-300 truncate">{data.analysis.fibonacci.signal}</span>
                  </div>
                  <div className={`font-mono font-bold shrink-0 ml-4 ${getScoreColor(data.analysis.fibonacci.score)}`}>
                    {data.analysis.fibonacci.score > 0 ? '+' : ''}{data.analysis.fibonacci.score.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-6 flex flex-col justify-center">
                <p className="text-slate-400 text-sm mb-1 uppercase tracking-tighter">Current Price</p>
                <p className="text-3xl font-bold">${data.current_price.toLocaleString()}</p>
              </div>
              <div className="glass-card p-6 flex flex-col justify-center">
                <p className="text-slate-400 text-sm mb-1 uppercase tracking-tighter">Trend</p>
                <div className={`flex items-center gap-2 text-xl font-bold ${data.trend === 'UPTREND' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.trend === 'UPTREND' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {data.trend}
                </div>
              </div>
              <div className="glass-card p-6 flex flex-col justify-center">
                <p className="text-slate-400 text-sm mb-1 uppercase tracking-tighter">RSI (14)</p>
                <p className={`text-3xl font-bold ${data.analysis.rsi.value > 70 ? 'text-rose-400' : data.analysis.rsi.value < 30 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                  {data.analysis.rsi.value.toFixed(2)}
                </p>
              </div>
              <div className="glass-card p-6 flex flex-col justify-center">
                <p className="text-slate-400 text-sm mb-1 uppercase tracking-tighter">MACD</p>
                <p className="text-xl font-mono font-bold text-purple-400">{data.analysis.macd.value.toFixed(4)}</p>
              </div>
            </div>
          </div>

          {/* Main Technical Analysis - Composite Chart Style */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Technical Analysis - Price, RSI & MACD
            </h2>

            <div className="space-y-4">
              {/* 1. Price Action */}
              <div className="h-[350px]">
                <p className="text-xs text-slate-500 uppercase mb-2 ml-10">Price & Moving Averages</p>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.history}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#475569"
                      fontSize={11}
                      tickFormatter={(val) => val.split(' ')[0]}
                    />
                    <YAxis stroke="#475569" fontSize={11} domain={['auto', 'auto']} tickFormatter={(val) => `$${val}`} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="close" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" name="Close Price" />
                    <Line type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="SMA 50" aria-label="Simple Moving Average 50" />
                    <Line type="monotone" dataKey="sma200" stroke="#a855f7" strokeWidth={1.5} dot={false} name="SMA 200" aria-label="Simple Moving Average 200" />

                    {Object.entries(data.fib_levels).map(([label, value]) => (
                      <ReferenceLine
                        key={label}
                        y={value}
                        stroke="#475569"
                        strokeDasharray="5 5"
                        label={{ value: label, position: 'right', fill: '#94a3b8', fontSize: 10 }}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* 2. RSI */}
              <div className="h-[150px] pt-4 border-t border-white/5">
                <p className="text-xs text-slate-500 uppercase mb-2 ml-10">Relative Strength Index (14)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} ticks={[30, 70]} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <Line type="monotone" dataKey="rsi" stroke="#6366f1" strokeWidth={2} dot={false} name="RSI" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 3. MACD */}
              <div className="h-[150px] pt-4 border-t border-white/5">
                <p className="text-xs text-slate-500 uppercase mb-2 ml-10">MACD (12, 26, 9)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis stroke="#475569" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Bar dataKey="histogram" fill="#475569" opacity={0.3} name="Histogram" />
                    <Line type="monotone" dataKey="macd" stroke="#a855f7" strokeWidth={1.5} dot={false} name="MACD" />
                    <Line type="monotone" dataKey="signal" stroke="#f43f5e" strokeWidth={1.5} dot={false} name="Signal" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>


          {/* Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold">Detailed History (Last 10 Days)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 text-sm">
                    <th className="p-4">Date</th>
                    <th className="p-4">High</th>
                    <th className="p-4">Low</th>
                    <th className="p-4">Close</th>
                    <th className="p-4">RSI</th>
                    <th className="p-4">MACD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.history.slice(-10).reverse().map((item, idx) => (
                    <tr key={idx} className="hover:bg-indigo-500/5 transition-colors">
                      <td className="p-4 text-sm font-medium">{item.date.split(' ')[0]}</td>
                      <td className="p-4">${item.high.toFixed(2)}</td>
                      <td className="p-4">${item.low.toFixed(2)}</td>
                      <td className="p-4 font-semibold">${item.close.toFixed(2)}</td>
                      <td className={`p-4 ${item.rsi! > 60 ? 'text-rose-400' : item.rsi! < 40 ? 'text-emerald-400' : ''}`}>
                        {item.rsi?.toFixed(2)}
                      </td>
                      <td className="p-4 text-xs font-mono">{item.macd?.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
