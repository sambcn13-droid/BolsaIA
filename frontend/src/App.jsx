import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Import Router components
import { getQuote, getChartData, getNews, getDividends, getMarketSentiment, getPortfolios, savePortfolios } from './api/client';
import StockSearch from './components/StockSearch';
import StockDashboard from './components/StockDashboard';
import MarketSentiment from './components/MarketSentiment';
import PortfolioManager from './components/PortfolioManager';
import AdvancedChart from './components/AdvancedChart'; // Import new component
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Briefcase, TrendingUp } from 'lucide-react';
import MarketSidebar from './components/MarketSidebar';
import PortfolioSummary from './components/PortfolioSummary';
import PercentageCalculator from './components/PercentageCalculator';
import CompoundInterestCalculator from './components/CompoundInterestCalculator';

const App = () => {
  // ... existing state ...
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [news, setNews] = useState([]);
  const [dividends, setDividends] = useState([]);
  const [marketSentiment, setMarketSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('DASHBOARD');

  // ... (Keep ALL existing state initialization and useEffects exactly as they were) ...

  const [portfolios, setPortfolios] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Flag to prevent overwriting with empty

  // LOAD PORTFOLIOS (Backend + Migration)
  useEffect(() => {
    const loadPortfolios = async () => {
      // 1. Try fetching from Backend
      const backendData = await getPortfolios();

      // 2. Check LocalStorage (Legacy/Migration)
      const localData = localStorage.getItem('bolsa_portfolios');
      const parsedLocal = localData ? JSON.parse(localData) : [];

      if (backendData && backendData.length > 0) {
        // Backend has data, use it (Single Source of Truth)
        setPortfolios(backendData);
      } else if (parsedLocal.length > 0) {
        // Backend is empty but Local has data -> MIGRATE
        console.log("Migrating local portfolios to backend...");
        setPortfolios(parsedLocal);
        await savePortfolios(parsedLocal);
      } else {
        // Both empty (New User)
        setPortfolios([]);
      }
      setIsDataLoaded(true);
    };
    loadPortfolios();
  }, []);

  // SAVE PORTFOLIOS (Sync to Backend)
  useEffect(() => {
    if (isDataLoaded) {
      // Only save if initial load is complete to avoid wiping DB with initial empty state
      const saveToBackend = async () => {
        await savePortfolios(portfolios);
        // Also keep local updated just in case/fallback
        localStorage.setItem('bolsa_portfolios', JSON.stringify(portfolios));
      };
      saveToBackend();
    }
  }, [portfolios, isDataLoaded]);

  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const loadSentiment = async () => {
      const data = await getMarketSentiment();
      setMarketSentiment(data);
    };
    loadSentiment();
  }, []);

  const handleSearch = async (symbol) => {
    setView('DASHBOARD');
    setLoading(true);
    setError(null);
    try {
      const [quoteData, chart, newsItems, dividendData] = await Promise.all([
        getQuote(symbol),
        getChartData(symbol, 'max', '1d'),
        getNews(symbol),
        getDividends(symbol)
      ]);
      setStockData(quoteData);
      setChartData(chart);
      setNews(newsItems);
      setDividends(dividendData);
    } catch (err) {
      setError('No se pudieron encontrar datos. Por favor verifica el símbolo o intenta de nuevo.');
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };



  const bgStyle = theme === 'dark'
    ? "bg-black text-white bg-[url('/wall-street-bull.jpg')] bg-cover bg-bottom bg-fixed bg-no-repeat relative before:absolute before:inset-0 before:bg-black/70 before:z-0"
    : "bg-gray-50 text-gray-900 bg-[url('/wall-street-bull.jpg')] bg-cover bg-bottom bg-fixed bg-no-repeat relative before:absolute before:inset-0 before:bg-white/80 before:z-0";



  // THIS IS THE MAIN CONTENT COMPONENT (Extracted from previous App return)
  const DashboardContent = () => (
    <div className={`min-h-screen transition-colors duration-500 ${bgStyle} flex flex-col`}>
      <div className="relative z-10 flex flex-col flex-1">

        {/* Top Header Bar - Static position to prevent overlap */}
        {/* Top Header Bar - Static position to prevent overlap */}
        {/* Top Header Bar - Static position to prevent overlap */}
        <div className="w-full flex justify-between items-center p-4 border-b border-gray-200/10 z-50 bg-inherit shadow-sm">
          {/* Logo a la izquierda */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('DASHBOARD')}>
            <img src="/aibolsa-final-logo.png" alt="Logo" className="h-12 w-auto drop-shadow-lg hover:scale-105 transition-transform" />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setView('PORTFOLIO')} className={`flex items-center gap-2 px-6 py-2 rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 border-2 border-yellow-600 bg-gradient-to-b from-yellow-50 via-yellow-200 to-yellow-400 text-yellow-900 font-bold tracking-wide ${view === 'PORTFOLIO' ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-black' : ''}`}>
              <Briefcase size={20} className="text-yellow-900" /> <span className="hidden sm:inline">Portafolio</span>
            </button>

            <button onClick={() => setView('PERCENTAGE')} className={`flex items-center gap-2 px-6 py-2 rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 border-2 border-yellow-600 bg-gradient-to-b from-yellow-50 via-yellow-200 to-yellow-400 text-yellow-900 font-bold tracking-wide ${view === 'PERCENTAGE' ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-black' : ''}`}>
              <span className="font-bold hidden sm:inline">%</span> <span className="hidden lg:inline">Porcentajes</span>
            </button>

            <button onClick={() => setView('COMPOUND')} className={`flex items-center gap-2 px-6 py-2 rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 border-2 border-yellow-600 bg-gradient-to-b from-yellow-50 via-yellow-200 to-yellow-400 text-yellow-900 font-bold tracking-wide ${view === 'COMPOUND' ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-black' : ''}`}>
              <TrendingUp size={20} className="text-yellow-900" /> <span className="hidden sm:inline">Interés Comp.</span>
            </button>

            <button onClick={() => { if (view !== 'DASHBOARD') setView('DASHBOARD'); }} className={`flex items-center gap-2 px-6 py-2 rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 border-2 border-yellow-600 bg-gradient-to-b from-yellow-50 via-yellow-200 to-yellow-400 text-yellow-900 font-bold tracking-wide ${view === 'DASHBOARD' ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-black' : ''}`}>
              <span className="font-bold">Bolsa</span>
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-3 rounded-lg shadow-lg transition-all transform hover:scale-110 active:scale-95 border-2 border-yellow-600 bg-gradient-to-b from-yellow-50 via-yellow-200 to-yellow-400 text-yellow-900`}>
              {theme === 'dark' ? <Sun size={24} className="text-yellow-900" /> : <Moon size={24} className="text-yellow-900" />}
            </button>
          </div>
        </div>

        {view === 'DASHBOARD' && (
          <div className="flex flex-col xl:flex-row w-full max-w-[1920px] mx-auto relative flex-1">

            {/* LEFT SIDEBAR - Portfolio */}
            <div className="hidden xl:block w-80 flex-shrink-0 p-6 sticky top-0 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar">
              <PortfolioSummary
                portfolios={portfolios}
                theme={theme}
                onViewPortfolio={() => setView('PORTFOLIO')}
              />
            </div>

            {/* CENTER CONTENT */}
            <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pb-12 pt-6">

              {!stockData && <MarketSentiment data={marketSentiment} theme={theme} />}

              <StockSearch onSearch={handleSearch} theme={theme} />

              {!stockData && !loading && (
                <div className="max-w-md mx-auto mt-8 text-center text-gray-500">
                  <p>Busca una acción o visualiza tus portafolios.</p>
                </div>
              )}

              {loading && (
                <div className="flex justify-center mt-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-blue-400 animate-pulse">Analizando mercados...</p>
                  </div>
                </div>
              )}

              {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-center mt-8 bg-red-500/10 py-3 rounded-lg max-w-md mx-auto border border-red-500/20">{error}</motion.div>}

              <AnimatePresence>
                {!loading && stockData && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <StockDashboard
                      data={stockData}
                      chartData={chartData}
                      news={news}
                      dividends={dividends}
                      isFavorite={portfolios.some(p => p.holdings.some(h => h.symbol === stockData.symbol))}
                      portfolios={portfolios}
                      onUpdatePortfolios={setPortfolios}
                      theme={theme}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT SIDEBAR - Futures/Market */}
            <div className="hidden xl:block w-80 flex-shrink-0 p-6 sticky top-0 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar">
              <MarketSidebar theme={theme} onSelect={handleSearch} />
            </div>
          </div>
        )}

        {view === 'PORTFOLIO' && <div className="p-8"><PortfolioManager portfolios={portfolios} onUpdatePortfolios={setPortfolios} onBack={() => setView('DASHBOARD')} theme={theme} /></div>}
        {view === 'PERCENTAGE' && <div className="p-8"><PercentageCalculator theme={theme} onBack={() => setView('DASHBOARD')} /></div>}
        {view === 'COMPOUND' && <div className="p-8"><CompoundInterestCalculator theme={theme} onBack={() => setView('DASHBOARD')} /></div>}
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/analysis/:symbol" element={<AdvancedChart theme={theme} />} />
        <Route path="/*" element={<DashboardContent />} />
      </Routes>
    </Router>
  );
};

export default App;
