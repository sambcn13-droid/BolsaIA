import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Activity, Star, Calendar, Percent, X, Check, Plus } from 'lucide-react';
import { getSentiment } from '../api/client';
import SentimentCard from './SentimentCard';

const Card = ({ children, delay = 0, className = "", theme = 'dark' }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`backdrop-blur-lg border rounded-2xl p-6 shadow-xl ${className} ${theme === 'dark'
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-gray-100 shadow-gray-200'
            }`}
    >
        {children}
    </motion.div>
);

const getCurrencySymbol = (currencyCode) => {
    const map = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥',
        'INR': '₹', 'RUB': '₽', 'BRL': 'R$', 'MXN': '$'
    };
    return map[currencyCode] || currencyCode || '$';
};

const StatCard = ({ title, value, subValue, icon: Icon, isPositive = true, delay, theme = 'dark' }) => (
    <Card delay={delay} theme={theme}>
        <div className="flex items-start justify-between mb-4">
            <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
                <h3 className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <Icon size={24} />
            </div>
        </div>
        {subValue && (
            <div className={`flex items-center text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                {subValue}
            </div>
        )}
    </Card>
);

const StockDashboard = ({ data, chartData, news, dividends = [], isFavorite, portfolios, onUpdatePortfolios, theme = 'dark' }) => {
    const navigate = useNavigate();
    if (!data) return null;

    const isPositive = data.change >= 0;

    // Sentiment State
    const [sentiment, setSentiment] = useState(null);
    const [isLoadingSentiment, setIsLoadingSentiment] = useState(false);

    // Fetch Sentiment on mount or symbol change
    React.useEffect(() => {
        const fetchAnalysis = async () => {
            if (data.symbol) {
                setIsLoadingSentiment(true);
                const result = await getSentiment(data.symbol);
                setSentiment(result);
                setIsLoadingSentiment(false);
            }
        };
        fetchAnalysis();
    }, [data.symbol]);

    const [timeRange, setTimeRange] = useState('ALL'); // '1', '2', ... '10', 'ALL'

    const filterOptions = [
        { label: '1 Año', value: '1' },
        { label: '2 Años', value: '2' },
        { label: '3 Años', value: '3' },
        { label: '4 Años', value: '4' },
        { label: '5 Años', value: '5' },
        { label: '6 Años', value: '6' },
        { label: '7 Años', value: '7' },
        { label: '8 Años', value: '8' },
        { label: '9 Años', value: '9' },
        { label: '10 Años', value: '10' },
        { label: 'Todos', value: 'ALL' },
    ];

    const filteredDividends = useMemo(() => {
        if (!dividends.length) return [];

        // Sort descending (newest first) just in case
        const sortedDivs = [...dividends].sort((a, b) => b.year - a.year);

        if (timeRange === 'ALL') return sortedDivs.reverse(); // Return oldest first for Logic chart

        const latestYear = sortedDivs[0].year;
        const yearsBack = parseInt(timeRange);
        const cutoffYear = latestYear - yearsBack + 1; // +1 to include current year

        return sortedDivs.filter(d => d.year >= cutoffYear).reverse(); // Chart reads left-to-right
    }, [dividends, timeRange]);

    // Price History Filter Logic
    const [priceTimeRange, setPriceTimeRange] = useState('ALL');
    const [chartView, setChartView] = useState('PRICE'); // 'PRICE' | 'PERCENT'

    const chartFilterOptions = [
        { label: '1 Año', value: '1' },
        { label: '2 Años', value: '2' },
        { label: '3 Años', value: '3' },
        { label: '4 Años', value: '4' },
        { label: '5 Años', value: '5' },
        { label: '6 Años', value: '6' },
        { label: '7 Años', value: '7' },
        { label: '8 Años', value: '8' },
        { label: '9 Años', value: '9' },
        { label: '10 Años', value: '10' },
        { label: 'Todos', value: 'ALL' },
    ];

    const filteredChartData = useMemo(() => {
        if (!chartData || !chartData.length) return [];

        let filtered = chartData;
        if (priceTimeRange !== 'ALL') {
            const yearsBack = parseInt(priceTimeRange);
            const cutoffDate = new Date();
            cutoffDate.setFullYear(cutoffDate.getFullYear() - yearsBack);
            filtered = chartData.filter(item => new Date(item.date) >= cutoffDate);
        }

        if (filtered.length === 0) return [];

        // Calculate Percentage Change relative to the first point of the selection
        const startPrice = filtered[0].close;
        return filtered.map(item => ({
            ...item,
            changePercent: startPrice !== 0 ? ((item.close - startPrice) / startPrice) * 100 : 0
        }));
    }, [chartData, priceTimeRange]);

    // Calculate total dividends for current year
    const currentYear = new Date().getFullYear();
    const totalDividendsCurrentYear = useMemo(() => {
        return dividends
            .filter(d => d.year === currentYear)
            .reduce((sum, d) => sum + d.amount, 0);
    }, [dividends, currentYear]);

    const infoTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const chartAxisColor = theme === 'dark' ? '#9CA3AF' : '#4B5563';
    const chartGridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const currency = getCurrencySymbol(data.currency);

    // Watchlist Modal Logic
    const [showWatchlistModal, setShowWatchlistModal] = useState(false);

    const handleToggleFavorite = () => {
        setShowWatchlistModal(true);
    };

    const handlePortfolioChange = (portfolioId) => {
        const symbol = data.symbol;
        const newPortfolios = portfolios.map(p => {
            if (p.id === portfolioId) {
                const exists = p.holdings.find(h => h.symbol === symbol);
                if (exists) {
                    // Remove from portfolio
                    return { ...p, holdings: p.holdings.filter(h => h.symbol !== symbol) };
                } else {
                    // Add to portfolio with default values for "watching"
                    const newHolding = {
                        id: Date.now().toString(),
                        symbol: symbol,
                        isin: '',
                        date: new Date().toISOString().split('T')[0],
                        shares: 0,
                        price: data.price || 0,
                        fees: 0
                    };
                    return { ...p, holdings: [...p.holdings, newHolding] };
                }
            }
            return p;
        });
        onUpdatePortfolios(newPortfolios);
    };

    const [newPortfolioName, setNewPortfolioName] = useState('');
    const [isCreatingPortfolio, setIsCreatingPortfolio] = useState(false);

    const handleCreatePortfolioInModal = () => {
        if (!newPortfolioName.trim()) return;

        const newPortfolio = {
            id: Date.now().toString(),
            name: newPortfolioName,
            color: '#10B981', // Default
            holdings: [{
                id: Date.now().toString(),
                symbol: data.symbol,
                isin: '',
                date: new Date().toISOString().split('T')[0],
                shares: 0,
                price: data.price || 0,
                fees: 0
            }]
        };

        onUpdatePortfolios([...portfolios, newPortfolio]);
        setNewPortfolioName('');
        setIsCreatingPortfolio(false);
    };

    return (
        <div className="space-y-6 w-full max-w-7xl mx-auto px-4 pb-12 relative">

            {/* Watchlist Modal */}
            <AnimatePresence>
                {showWatchlistModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowWatchlistModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl border ${theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-100'}`}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Guardar en Portafolio</h3>
                                <button onClick={() => setShowWatchlistModal(false)} className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                                {portfolios.map(p => {
                                    const isSelected = p.holdings.some(h => h.symbol === data.symbol);
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => handlePortfolioChange(p.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                                                ? (theme === 'dark' ? 'bg-blue-500/20 border-blue-500/50' : 'bg-blue-50 border-blue-200')
                                                : (theme === 'dark' ? 'bg-white/5 border-transparent hover:bg-white/10' : 'bg-gray-50 border-transparent hover:bg-gray-100')
                                                }`}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}
                                            >
                                                {isSelected && <Check size={10} className="text-white" />}
                                            </div>
                                            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: p.color || '#3B82F6' }} />
                                            <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{p.name} ({p.holdings.length})</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {isCreatingPortfolio ? (
                                <div className="mt-4 flex gap-2">
                                    <input
                                        autoFocus
                                        value={newPortfolioName}
                                        onChange={(e) => setNewPortfolioName(e.target.value)}
                                        placeholder="Nuevo Portafolio..."
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none border focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'bg-white/10 border-white/20 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreatePortfolioInModal()}
                                    />
                                    <button
                                        onClick={handleCreatePortfolioInModal}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreatingPortfolio(true)}
                                    className={`w-full py-2 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                                >
                                    <Plus size={16} />
                                    Crear nuevo portafolio
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Info */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    {data.logo_url && <img src={data.logo_url} alt={data.symbol} className={`w-16 h-16 rounded-full p-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-white shadow'}`} />}
                    <div>
                        <h1 className={`text-4xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{data.symbol}</h1>
                        <p className={infoTextColor}>{data.shortName}</p>
                    </div>
                </div>
                <button
                    onClick={handleToggleFavorite}
                    className={`p-3 rounded-full transition-all ${isFavorite
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        : theme === 'dark'
                            ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 shadow-sm border border-gray-100'
                        }`}
                >
                    <Star size={28} fill={isFavorite ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Stats Grid - Fundamentals */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Precio Actual"
                    value={`${currency}${data.price?.toFixed(2)}`}
                    subValue={`${data.change >= 0 ? '+' : ''}${data.change?.toFixed(2)}%`}
                    icon={DollarSign}
                    isPositive={data.change >= 0}
                    delay={0.1}
                    theme={theme}
                />
                <StatCard
                    title="Capitalización"
                    value={data.marketCap ? `${currency}${(data.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
                    icon={Activity}
                    isPositive={true}
                    delay={0.2}
                    theme={theme}
                />
                <StatCard
                    title="PER (Trailing)"
                    value={data.trailingPE?.toFixed(2) || 'N/A'}
                    icon={BarChart2}
                    isPositive={true}
                    delay={0.3}
                    theme={theme}
                />
                <StatCard
                    title="Rentabilidad Div."
                    value={data.dividendYield ? `${(data.dividendYield * 100).toFixed(2)}%` : '0%'}
                    subValue={totalDividendsCurrentYear > 0 ? `Total ${currentYear}: ${currency}${totalDividendsCurrentYear.toFixed(2)}` : null}
                    icon={Percent}
                    isPositive={true}
                    delay={0.4}
                    theme={theme}
                />
            </div>



            {/* Main Chart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <Card className="lg:col-span-2 min-h-[400px]" delay={0.5} theme={theme}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Histórico de Precios</h3>

                            {/* NEW: Advanced Analysis Button */}
                            <button
                                onClick={() => navigate(`/analysis/${data.symbol}`)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-blue-500/25 ring-1 ring-blue-500"
                            >
                                <BarChart2 size={14} />
                                Análisis Técnico Avanzado
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* View Toggle */}
                            <div className={`flex p-1 rounded-lg border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                                <button
                                    onClick={() => setChartView('PRICE')}
                                    className={`px-3 py-1 text-xs rounded-md transition-all ${chartView === 'PRICE'
                                        ? 'bg-blue-500 text-white'
                                        : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    Precio ({currency})
                                </button>
                                <button
                                    onClick={() => setChartView('PERCENT')}
                                    className={`px-3 py-1 text-xs rounded-md transition-all ${chartView === 'PERCENT'
                                        ? 'bg-blue-500 text-white'
                                        : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    Cambio (%)
                                </button>
                            </div>

                            {/* Range Filter */}
                            <div className={`flex items-center gap-2 p-1 rounded-lg border hidden sm:flex ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                                <span className={`text-xs pl-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Rango:</span>
                                <select
                                    value={priceTimeRange}
                                    onChange={(e) => setPriceTimeRange(e.target.value)}
                                    className={`bg-transparent text-xs focus:outline-none cursor-pointer p-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                >
                                    {chartFilterOptions.map(option => (
                                        <option key={option.value} value={option.value} className={theme === 'dark' ? "bg-gray-900 text-white" : "bg-white text-gray-900"}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={filteredChartData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                <XAxis dataKey="date" stroke={chartAxisColor} />
                                <YAxis
                                    stroke={chartAxisColor}
                                    domain={['auto', 'auto']}
                                    tickFormatter={(val) => chartView === 'PERCENT' ? `${val.toFixed(0)}%` : `${currency}${val}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                                        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: '8px',
                                        color: theme === 'dark' ? '#fff' : '#111'
                                    }}
                                    itemStyle={{ color: theme === 'dark' ? '#fff' : '#111' }}
                                    formatter={(value) => [
                                        chartView === 'PERCENT' ? `${value.toFixed(2)}%` : `${currency}${value.toFixed(2)}`,
                                        chartView === 'PERCENT' ? 'Cambio' : 'Precio'
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={chartView === 'PERCENT' ? "changePercent" : "close"}
                                    stroke={isPositive ? "#10B981" : "#EF4444"}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorPrice)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* News Feed */}
                <div className="lg:col-span-1">
                    <Card delay={0.6} className="h-full" theme={theme}>
                        <h3 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Últimas Noticias</h3>
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {news.map((item, index) => (
                                <a
                                    key={index}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`block p-4 rounded-xl transition-colors border group ${theme === 'dark'
                                        ? 'bg-white/5 hover:bg-white/10 border-white/5'
                                        : 'bg-gray-50 hover:bg-gray-100 border-gray-100'
                                        }`}
                                >
                                    <h4 className={`text-sm font-medium mb-2 group-hover:text-blue-400 transition-colors line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                        {item.title}
                                    </h4>
                                    <div className={`flex justify-between items-center text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <span>{item.source || 'Noticia'}</span>
                                        <span>{item.time}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </Card>
                </div>
            </div >

            {/* AI Sentiment Integration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Sentiment Card */}
                <div className="md:col-span-1">
                    <SentimentCard sentiment={sentiment} isLoading={isLoadingSentiment} theme={theme} />
                </div>

                {/* Placeholder for future specific Analysis */}
                <div className="md:col-span-1 hidden md:block opacity-50 pointer-events-none filter grayscale">
                    {/* Can mirror sentiment card just to fill space or leave empty */}
                </div>
            </div>

            {/* Dividend History Section */}
            {
                dividends.length > 0 && (
                    <div className="mt-8">
                        <Card delay={0.7} theme={theme}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Historial de Dividendos</h3>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Pagos realizados por año</p>
                                    </div>
                                </div>

                                {/* Year Filters */}
                                <div className={`flex items-center gap-2 p-2 rounded-lg border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                                    <span className={`text-sm pl-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Mostrar:</span>
                                    <select
                                        value={timeRange}
                                        onChange={(e) => setTimeRange(e.target.value)}
                                        className={`bg-transparent text-sm focus:outline-none cursor-pointer p-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                    >
                                        {filterOptions.map(option => (
                                            <option key={option.value} value={option.value} className={theme === 'dark' ? "bg-gray-900 text-white" : "bg-white text-gray-900"}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Dividend Chart */}
                                <div className="lg:col-span-2 h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={filteredDividends}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                stroke={chartAxisColor}
                                                tickFormatter={(val) => val.split('-')[0]} // Show just year on axis mostly
                                            />
                                            <YAxis stroke={chartAxisColor} />
                                            <Tooltip
                                                cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                                contentStyle={{
                                                    backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                                                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                                                    borderRadius: '8px',
                                                    color: theme === 'dark' ? '#fff' : '#111'
                                                }}
                                                itemStyle={{ color: theme === 'dark' ? '#fff' : '#111' }}
                                            />
                                            <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} name={`Dividendo (${currency})`} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Dividend Table */}
                                <div className={`lg:col-span-1 border-l pl-0 lg:pl-8 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredDividends.map((div, i) => (
                                            <div key={i} className={`flex justify-between items-center p-3 rounded-lg transition-colors ${theme === 'dark'
                                                ? 'bg-white/5 hover:bg-white/10'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                                }`}>
                                                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{div.date}</span>
                                                <span className="text-green-400 font-bold">+{currency}{div.amount.toFixed(3)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }
        </div >
    );
};

export default StockDashboard;
