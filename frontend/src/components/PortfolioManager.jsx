import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowLeft, MoreVertical, Wallet, X, RefreshCw, Calendar, DollarSign, PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import { getHistoricalPrice, getBatchQuotes, getDividends, searchStocks } from '../api/client';
import { PieChart as RePieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = {
    blue: '#3B82F6',
    green: '#10B981',
    red: '#EF4444',
    yellow: '#F59E0B',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    gray: '#6B7280',
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#0EA5E9'];

const PortfolioManager = ({ portfolios, onUpdatePortfolios, onBack, theme = 'dark' }) => {
    const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPortfolioName, setNewPortfolioName] = useState('');

    // Holding Form State
    const [isAddingHolding, setIsAddingHolding] = useState(false);
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);
    const [priceError, setPriceError] = useState(null);
    const [holdingForm, setHoldingForm] = useState({
        symbol: '',
        isin: '',
        date: new Date().toISOString().split('T')[0],
        shares: '',
        price: '',
        fees: '0',
        totalInvestment: ''
    });

    // Live Prices for calculations
    const [currentPrices, setCurrentPrices] = useState({});
    const [dividendsData, setDividendsData] = useState({});

    // Search State
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDebug, setShowDebug] = useState(false); // DEBUG MODE

    const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);

    // Fetch Live Prices for the selected portfolio
    const fetchLivePrices = async () => {
        if (!selectedPortfolio || selectedPortfolio.holdings.length === 0) return;

        const symbols = [...new Set(selectedPortfolio.holdings.map(h => h.symbol))];
        const prices = await getBatchQuotes(symbols);
        setCurrentPrices(prices);

        // Fetch Dividends
        const divs = {};
        await Promise.all(symbols.map(async (sym) => {
            if (!dividendsData[sym]) { // Cache check
                const data = await getDividends(sym);
                divs[sym] = data;
            }
        }));
        if (Object.keys(divs).length > 0) {
            setDividendsData(prev => ({ ...prev, ...divs }));
        }
    };

    useEffect(() => {
        if (selectedPortfolioId) {
            fetchLivePrices();
            const interval = setInterval(fetchLivePrices, 60000);
            return () => clearInterval(interval);
        }
    }, [selectedPortfolioId, portfolios]); // Re-fetch on portfolio change

    // -- Handlers --

    const fetchPriceForDate = async (symbol, date) => {
        if (!symbol || !date) return;

        setIsLoadingPrice(true);
        setPriceError(null);
        try {
            // Ensure symbol is upper
            const sym = symbol.toUpperCase();
            const data = await getHistoricalPrice(sym, date);

            if (data && data.close) {
                setHoldingForm(prev => {
                    const newPrice = data.close.toFixed(2);
                    // Update total if shares exist
                    let updates = { price: newPrice };
                    if (prev.shares) {
                        updates.totalInvestment = (parseFloat(prev.shares) * parseFloat(newPrice)).toFixed(2);
                    }
                    return { ...prev, ...updates };
                });
            } else {
                setPriceError("No encontrado");
            }
        } catch (err) {
            setPriceError("Error");
        } finally {
            setIsLoadingPrice(false);
        }
    };

    const handleSharesChange = (val) => {
        const shares = val;
        let updates = { shares };
        if (holdingForm.price && !isNaN(parseFloat(holdingForm.price)) && !isNaN(parseFloat(shares))) {
            updates.totalInvestment = (parseFloat(shares) * parseFloat(holdingForm.price)).toFixed(2);
        }
        setHoldingForm(prev => ({ ...prev, ...updates }));
    };

    const handleTotalInvestmentChange = (val) => {
        const total = val;
        let updates = { totalInvestment: total };
        // User requested: "Calcule los titulos... aunque tengas que redondear... mas abajo"
        // Interpreted as: Calculate integer shares (floor) fitting in the budget.
        if (holdingForm.price && !isNaN(parseFloat(holdingForm.price)) && !isNaN(parseFloat(total)) && parseFloat(holdingForm.price) !== 0) {
            const rawShares = parseFloat(total) / parseFloat(holdingForm.price);
            // Use Math.floor for whole shares
            const shares = Math.floor(rawShares);
            updates.shares = shares.toString();
        }
        setHoldingForm(prev => ({ ...prev, ...updates }));
    };

    // Correct total investment on blur to reflect actual cost of shares
    const handleTotalBlur = () => {
        if (holdingForm.shares && holdingForm.price && holdingForm.totalInvestment) {
            const realTotal = (parseFloat(holdingForm.shares) * parseFloat(holdingForm.price)).toFixed(2);
            // Only update if it's different and user isn't clearing it
            setHoldingForm(prev => ({ ...prev, totalInvestment: realTotal }));
        }
    };

    // Auto-fetch when date changes (if symbol is present)
    useEffect(() => {
        if (isAddingHolding && holdingForm.symbol && holdingForm.date) {
            const timer = setTimeout(() => {
                fetchPriceForDate(holdingForm.symbol, holdingForm.date);
            }, 800); // 800ms debounce
            return () => clearTimeout(timer);
        }
    }, [holdingForm.date, holdingForm.symbol, isAddingHolding]);

    const handleSearch = async (query) => {
        setHoldingForm(prev => ({ ...prev, symbol: query.toUpperCase() }));
        if (query.length >= 1) {
            setIsSearching(true);
            const results = await searchStocks(query);
            setSearchResults(results || []);
            setIsSearching(false);
        } else {
            setSearchResults([]);
        }
    };

    const selectSymbol = (item) => {
        setHoldingForm(prev => ({ ...prev, symbol: item.symbol, isin: item.isin || '' }));
        setSearchResults([]);
        handleSymbolBlur(); // Trigger upper case and potential fetch
    };


    const handleCreatePortfolio = (e) => {
        e.preventDefault();
        if (!newPortfolioName.trim()) return;

        const newPortfolio = {
            id: Date.now().toString(),
            name: newPortfolioName,
            color: Object.values(COLORS)[portfolios.length % Object.keys(COLORS).length],
            holdings: []
        };

        onUpdatePortfolios([...portfolios, newPortfolio]);
        setNewPortfolioName('');
        setShowCreateForm(false);
    };

    const handleDeletePortfolio = (id) => {
        if (window.confirm('¿Borrar este portafolio y todas sus operaciones?')) {
            onUpdatePortfolios(portfolios.filter(p => p.id !== id));
            if (selectedPortfolioId === id) setSelectedPortfolioId(null);
        }
    };

    // State for editing
    const [editingHoldingId, setEditingHoldingId] = useState(null);

    const handleSymbolBlur = async () => {
        // Upper case symbol on blur
        if (holdingForm.symbol) {
            setHoldingForm(prev => ({ ...prev, symbol: prev.symbol.toUpperCase() }));
        }
    };

    const handleEditHolding = (holding) => {
        setHoldingForm({
            symbol: holding.symbol,
            isin: holding.isin || '',
            date: holding.date,
            shares: holding.shares.toString(),
            price: holding.price.toString(),
            fees: holding.fees.toString(),
            totalInvestment: (holding.shares * holding.price).toFixed(2)
        });
        setEditingHoldingId(holding.id);
        setIsAddingHolding(true);
        setPriceError(null);
    };

    const handleCancelEdit = () => {
        setIsAddingHolding(false);
        setEditingHoldingId(null);
        setHoldingForm({ symbol: '', date: new Date().toISOString().split('T')[0], shares: '', price: '', fees: '0' });
        setPriceError(null);
    };

    const handleAddHolding = (e) => {
        e.preventDefault();
        if (!holdingForm.symbol || !holdingForm.shares || !holdingForm.price) return;

        const updatedPortfolios = portfolios.map(p => {
            if (p.id === selectedPortfolioId) {
                let newHoldings;

                if (editingHoldingId) {
                    // Update existing holding
                    newHoldings = p.holdings.map(h => {
                        if (h.id === editingHoldingId) {
                            return {
                                ...h,
                                symbol: holdingForm.symbol.toUpperCase(),
                                isin: holdingForm.isin || '',
                                date: holdingForm.date,
                                shares: parseFloat(holdingForm.shares),
                                price: parseFloat(holdingForm.price),
                                fees: parseFloat(holdingForm.fees) || 0
                            };
                        }
                        return h;
                    });
                } else {
                    // Create new holding
                    const newHolding = {
                        id: Date.now().toString(),
                        symbol: holdingForm.symbol.toUpperCase(),
                        isin: holdingForm.isin || '',
                        date: holdingForm.date,
                        shares: parseFloat(holdingForm.shares),
                        price: parseFloat(holdingForm.price),
                        fees: parseFloat(holdingForm.fees) || 0
                    };
                    newHoldings = [...p.holdings, newHolding];
                }

                return { ...p, holdings: newHoldings };
            }
            return p;
        });

        onUpdatePortfolios(updatedPortfolios);
        handleCancelEdit(); // Reset form and state
    };

    const handleDeleteHolding = (holdingId) => {
        const updatedPortfolios = portfolios.map(p => {
            if (p.id === selectedPortfolioId) {
                return { ...p, holdings: p.holdings.filter(h => h.id !== holdingId) };
            }
            return p;
        });
        onUpdatePortfolios(updatedPortfolios);
        if (editingHoldingId === holdingId) {
            handleCancelEdit();
        }
    };

    // -- Styles --
    const bgClass = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm';
    const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const subTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const inputClass = `w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'}`;
    const tableHeaderClass = `text-left text-xs font-medium uppercase tracking-wider py-3 px-4 ${subTextClass}`;
    const tableRowClass = `border-b ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50'} transition-colors`;
    const tdClass = `py-4 px-4 text-sm ${textClass}`;

    // -- Calculations --
    const getPortfolioStats = (portfolio) => {
        let totalInvested = 0;
        let totalCurrent = 0;
        let totalDividends = 0;

        portfolio.holdings.forEach(h => {
            const invested = (h.shares * h.price) + h.fees;
            totalInvested += invested;

            const currentPrice = currentPrices[h.symbol]?.price || h.price; // Fallback to buy price if no live data
            const currentVal = h.shares * currentPrice;
            totalCurrent += currentVal;

            totalDividends += calculateAccumulatedDividends(h);
        });

        const totalGain = totalCurrent - totalInvested;
        const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

        const totalReturn = totalGain + totalDividends;
        const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

        return { totalInvested, totalCurrent, totalGain, totalGainPercent, totalDividends, totalReturn, totalReturnPercent };
    };

    const getPieData = (portfolio) => {
        // Aggregate by symbol
        const allocation = {};
        portfolio.holdings.forEach(h => {
            const currentPrice = currentPrices[h.symbol]?.price || h.price;
            const val = h.shares * currentPrice;
            allocation[h.symbol] = (allocation[h.symbol] || 0) + val;
        });

        return Object.entries(allocation).map(([name, value]) => ({ name, value }));
    };

    const calculateAccumulatedDividends = (holding) => {
        if (!dividendsData[holding.symbol] || !holding.date) return 0;

        const purchaseDate = new Date(holding.date);
        const holdingDivs = dividendsData[holding.symbol].filter(d => new Date(d.date) >= purchaseDate);

        const totalPerShare = holdingDivs.reduce((sum, d) => sum + d.amount, 0);
        return totalPerShare * holding.shares;
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                    <ArrowLeft size={20} />
                    <span>Volver</span>
                </button>
                <div onClick={() => setShowDebug(!showDebug)} className="cursor-pointer">
                    <h2 className={`text-3xl font-bold ${textClass}`}>Portafolios</h2>
                </div>
                {!selectedPortfolioId && (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Nuevo Portafolio</span>
                    </button>
                )}
            </div>

            {/* Create Portfolio Modal */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowCreateForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`w-full max-w-md p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-100 shadow-xl'}`}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className={`text-xl font-bold mb-4 ${textClass}`}>Crear Nuevo Portafolio</h3>
                            <form onSubmit={handleCreatePortfolio} className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${subTextClass}`}>Nombre</label>
                                    <input
                                        type="text"
                                        value={newPortfolioName}
                                        onChange={(e) => setNewPortfolioName(e.target.value)}
                                        placeholder="Ej. Jubilación, Ahorros..."
                                        className={inputClass}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateForm(false)}
                                        className={`px-4 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                    >
                                        Crear
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {
                !selectedPortfolioId ? (
                    // Portfolio List
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {portfolios.map((portfolio) => {
                            const { totalCurrent, totalGain, totalGainPercent } = getPortfolioStats(portfolio);
                            return (
                                <motion.div
                                    key={portfolio.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => setSelectedPortfolioId(portfolio.id)}
                                    className={`rounded-2xl border overflow-hidden cursor-pointer group hover:border-blue-500/50 transition-all ${bgClass}`}
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                                                <Wallet className="text-blue-400" size={24} />
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeletePortfolio(portfolio.id); }}
                                                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <h3 className={`text-xl font-bold mb-1 ${textClass}`}>{portfolio.name}</h3>
                                        <p className={`text-sm ${subTextClass} mb-4`}>{portfolio.holdings.length} operaciones</p>

                                        <div className="pt-4 border-t border-dashed border-gray-500/20">
                                            <p className={`text-xs ${subTextClass} uppercase tracking-wider mb-1`}>Valor Actual</p>
                                            <h4 className={`text-2xl font-bold ${textClass}`}>${totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                                            <div className={`flex items-center mt-2 text-sm ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {totalGain >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                                                <span>
                                                    {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString()} ({totalGainPercent.toFixed(2)}%)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    // Single Portfolio View
                    <div className="space-y-6">
                        {/* Portfolio Header & Stats */}
                        <div className={`p-6 rounded-2xl border ${bgClass} flex flex-col xl:flex-row justify-between items-center gap-6`}>
                            <div className="text-center xl:text-left">
                                <button
                                    onClick={() => setSelectedPortfolioId(null)}
                                    className={`text-sm mb-2 flex items-center justify-center xl:justify-start gap-1 ${subTextClass} hover:text-blue-500`}
                                >
                                    <ArrowLeft size={14} /> Volver a lista
                                </button>
                                <h2 className={`text-3xl font-bold ${textClass}`}>{selectedPortfolio.name}</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center bg-transparent">
                                <div>
                                    <p className={`text-xs ${subTextClass} uppercase tracking-widest`}>Contribuciones</p>
                                    <p className={`text-lg font-semibold ${textClass}`}>${getPortfolioStats(selectedPortfolio).totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                </div>
                                <div>
                                    <p className={`text-xs ${subTextClass} uppercase tracking-widest`}>Valor de Mercado</p>
                                    <p className={`text-xl font-bold text-blue-400`}>${getPortfolioStats(selectedPortfolio).totalCurrent.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                </div>
                                <div>
                                    <p className={`text-xs ${subTextClass} uppercase tracking-widest`}>Retorno en Precio</p>
                                    <p className={`text-lg font-bold ${getPortfolioStats(selectedPortfolio).totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {getPortfolioStats(selectedPortfolio).totalGain >= 0 ? '+' : ''}
                                        {getPortfolioStats(selectedPortfolio).totalGain.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-xs ${subTextClass} uppercase tracking-widest text-yellow-500`}>Dividendos Recibidos</p>
                                    <p className={`text-lg font-bold text-yellow-500`}>
                                        +${getPortfolioStats(selectedPortfolio).totalDividends.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-xs ${subTextClass} uppercase tracking-widest text-purple-400`}>Retorno Total</p>
                                    <p className={`text-xl font-bold ${getPortfolioStats(selectedPortfolio).totalReturn >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                                        {getPortfolioStats(selectedPortfolio).totalReturn >= 0 ? '+' : ''}
                                        {getPortfolioStats(selectedPortfolio).totalReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Holdings Table */}
                            <div className={`lg:col-span-2 rounded-2xl border ${bgClass}`}>
                                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                    <h3 className={`font-bold ${textClass}`}>Operaciones</h3>
                                    <button
                                        onClick={() => setIsAddingHolding(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
                                    >
                                        <Plus size={16} /> Añadir
                                    </button>
                                </div>

                                <motion.form
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    onSubmit={handleAddHolding}
                                    className="p-4 border-b border-white/5 bg-blue-500/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end overflow-visible"
                                >

                                    <div className="relative z-50">
                                        <label className={`block text-xs mb-1 ${subTextClass}`}>Símbolo</label>
                                        <input
                                            required
                                            value={holdingForm.symbol}
                                            onChange={e => handleSearch(e.target.value)}
                                            onBlur={() => setTimeout(() => setSearchResults([]), 200)} // Delay default to allow click
                                            placeholder="Buscar (ej. AAPL, ETF...)"
                                            className={inputClass}
                                        />
                                        {searchResults.length > 0 && (
                                            <div className={`absolute left-0 mt-1 w-full max-h-60 overflow-y-auto rounded-lg shadow-2xl border z-50 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                {searchResults.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => selectSymbol(item)}
                                                        className={`px-3 py-2 cursor-pointer text-xs flex flex-col ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <span className={`font-bold ${textClass}`}>{item.symbol}</span>
                                                        <span className={subTextClass}>{item.name} ({item.exchange})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {priceError === "No encontrado" && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                            <label className={`block text-xs mb-1 ${subTextClass} text-yellow-500`}>Código ISIN (Opcional)</label>
                                            <input
                                                value={holdingForm.isin}
                                                onChange={e => setHoldingForm({ ...holdingForm, isin: e.target.value })}
                                                placeholder="US1234567890"
                                                className={`${inputClass} border-yellow-500/50 focus:ring-yellow-500`}
                                            />
                                        </motion.div>
                                    )}
                                    <div>
                                        <label className={`block text-xs mb-1 ${subTextClass}`}>Fecha Compra</label>
                                        <input
                                            type="date"
                                            required
                                            value={holdingForm.date}
                                            onChange={e => setHoldingForm({ ...holdingForm, date: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs mb-1 ${subTextClass}`}>Cantidad</label>
                                        <input
                                            type="number"
                                            required
                                            step="any"
                                            value={holdingForm.shares}
                                            onChange={e => handleSharesChange(e.target.value)}
                                            placeholder="0"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs mb-1 ${subTextClass} text-blue-400`}>O Inversión Total ($)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={holdingForm.totalInvestment}
                                            onChange={e => handleTotalInvestmentChange(e.target.value)}
                                            onBlur={handleTotalBlur}
                                            placeholder="0.00"
                                            className={`${inputClass} ring-1 ring-blue-500/50`}
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className={`block text-xs mb-1 ${subTextClass}`}>
                                            Precio ($)
                                            {priceError && <span className="text-red-400 ml-1 text-[10px]">{priceError}</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                step="any"
                                                value={holdingForm.price}
                                                onChange={e => setHoldingForm({ ...holdingForm, price: e.target.value })}
                                                placeholder={isLoadingPrice ? "Cargando..." : "0.00"}
                                                className={`${inputClass} pr-8`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fetchPriceForDate(holdingForm.symbol, holdingForm.date)}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400"
                                                title="Actualizar precio por fecha"
                                            >
                                                <RefreshCw size={14} className={isLoadingPrice ? "animate-spin" : ""} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-xs mb-1 ${subTextClass}`}>Comisión ($)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={holdingForm.fees}
                                            onChange={e => setHoldingForm({ ...holdingForm, fees: e.target.value })}
                                            placeholder="0"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex gap-2 sm:col-span-2 md:col-span-5 justify-end mt-2">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className={`px-3 py-1.5 rounded-lg text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500"
                                        >
                                            {editingHoldingId ? 'Guardar Cambios' : 'Guardar Operación'}
                                        </button>
                                    </div>
                                </motion.form>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className={theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}>
                                                <th className={tableHeaderClass}>Activo</th>
                                                <th className={tableHeaderClass}>Fecha</th>
                                                <th className={`${tableHeaderClass} text-right`}>Cant.</th>
                                                <th className={`${tableHeaderClass} text-right`}>Precio C.</th>
                                                <th className={`${tableHeaderClass} text-right`}>Actual</th>
                                                <th className={`${tableHeaderClass} text-right`}>Valor ($)</th>
                                                <th className={`${tableHeaderClass} text-right text-yellow-500`}>Div. ($)</th>
                                                <th className={`${tableHeaderClass} text-right`}>G/P (Cap.)</th>
                                                <th className={`${tableHeaderClass} text-right text-purple-400`}>Total G/P</th>
                                                <th className={tableHeaderClass}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedPortfolio.holdings.map(holding => {
                                                const currentP = currentPrices[holding.symbol]?.price || holding.price;
                                                const totalCost = (holding.shares * holding.price) + holding.fees;
                                                const currentVal = holding.shares * currentP;
                                                const gain = currentVal - totalCost;
                                                const gainPercent = (gain / totalCost) * 100;

                                                const divAmount = calculateAccumulatedDividends(holding);
                                                const divYield = totalCost > 0 ? (divAmount / totalCost) * 100 : 0;

                                                const totalReturn = gain + divAmount;
                                                const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

                                                const assetName = currentPrices[holding.symbol]?.name || '';
                                                const assetType = currentPrices[holding.symbol]?.type || '';

                                                return (
                                                    <tr key={holding.id} className={tableRowClass}>
                                                        <td className={tdClass}>
                                                            <div className="font-bold">{holding.symbol}</div>
                                                            <div className="text-[10px] sm:text-xs text-gray-500">{assetName}</div>
                                                            <div className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded inline-block mt-0.5">{assetType}</div>
                                                        </td>
                                                        <td className={tdClass}>{holding.date}</td>
                                                        <td className={`${tdClass} text-right`}>{holding.shares}</td>
                                                        <td className={`${tdClass} text-right text-gray-400`}>${holding.price.toFixed(2)}</td>
                                                        <td className={`${tdClass} text-right font-medium`}>${currentP.toFixed(2)}</td>
                                                        <td className={`${tdClass} text-right font-bold`}>${currentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        <td className={`${tdClass} text-right`}>
                                                            <div className="text-yellow-500 font-medium">
                                                                +${divAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                            <div className="text-xs text-yellow-500/70">
                                                                {divYield.toFixed(2)}%
                                                            </div>
                                                        </td>
                                                        <td className={`${tdClass} text-right`}>
                                                            <div className={gain >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                                {gain >= 0 ? '+' : ''}{gain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                            <div className={`text-xs ${gain >= 0 ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                                                {gainPercent.toFixed(2)}%
                                                            </div>
                                                        </td>
                                                        <td className={`${tdClass} text-right`}>
                                                            <div className={`font-bold ${totalReturn >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                                                                {totalReturn >= 0 ? '+' : ''}{totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                            <div className={`text-xs ${totalReturn >= 0 ? 'text-purple-500/70' : 'text-red-500/70'}`}>
                                                                {totalReturnPercent.toFixed(2)}%
                                                            </div>
                                                        </td>
                                                        <td className={`${tdClass} text-right space-x-2`}>
                                                            <button
                                                                onClick={() => handleEditHolding(holding)}
                                                                className="text-gray-500 hover:text-blue-500 transition-colors"
                                                                title="Editar"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteHolding(holding.id)}
                                                                className="text-gray-500 hover:text-red-500 transition-colors"
                                                                title="Borrar"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {selectedPortfolio.holdings.length === 0 && (
                                                <tr>
                                                    <td colSpan="8" className="py-8 text-center text-gray-500">No hay operaciones registradas.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Charts Grid - Expanded Layout */}
                            {/* Diversification - Keeping it on the right to fulfill user preference */}
                            <div className={`rounded-2xl border p-6 flex flex-col items-center justify-center min-h-[400px] ${bgClass}`}>
                                <h3 className={`font-bold mb-4 w-full text-left ${textClass}`}>Planificación de Activos (Diversificación)</h3>
                                {selectedPortfolio.holdings.length > 0 ? (
                                    <div className="w-full h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={getPieData(selectedPortfolio)}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {getPieData(selectedPortfolio).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <ReTooltip
                                                    formatter={(value) => `$${value.toLocaleString()}`}
                                                    contentStyle={{
                                                        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                                                        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                                                        borderRadius: '8px',
                                                        color: theme === 'dark' ? '#fff' : '#111'
                                                    }}
                                                />
                                                <Legend />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-sm">Añade activos para ver el gráfico</div>
                                )}
                            </div>

                            {/* Annual Dividends Projection - Moved below and expanded */}
                            <div className={`lg:col-span-3 rounded-2xl border p-8 flex flex-col items-center justify-center min-h-[500px] ${bgClass}`}>
                                <h3 className={`font-bold mb-4 w-full text-left ${textClass}`}>Proyección de Ingresos</h3>
                                {selectedPortfolio.holdings.length > 0 ? (
                                    <div className="w-full h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={(() => {
                                                // Estimate Annual Dividends
                                                let annualTotal = 0;
                                                selectedPortfolio.holdings.forEach(h => {
                                                    const divs = dividendsData[h.symbol] || [];
                                                    // Look at last year's dividends to estimate annual yield
                                                    const lastYear = new Date().getFullYear() - 1;
                                                    const lastYearDivs = divs.filter(d => d.year === lastYear);
                                                    const divPerShare = lastYearDivs.reduce((sum, d) => sum + d.amount, 0);

                                                    // Fallback: If no last year divs (IPO/New), try current year or use 0
                                                    // A more robust app would use 'forwardAnnualDividendRate' from quote
                                                    annualTotal += (divPerShare > 0 ? divPerShare : 0) * h.shares;
                                                });

                                                const data = [];
                                                const currentYear = new Date().getFullYear();
                                                for (let i = 0; i < 10; i++) {
                                                    const year = currentYear + i;
                                                    // Simple growth model: 5% CAGR assumption for visualization
                                                    const amount = annualTotal * Math.pow(1.05, i);
                                                    const dripAmount = annualTotal * Math.pow(1.08, i); // 8% with reinvestment
                                                    data.push({ year, amount, dripAmount });
                                                }
                                                return data;
                                            })()}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} vertical={false} />
                                                <XAxis dataKey="year" stroke={theme === 'dark' ? '#9CA3AF' : '#4B5563'} tick={{ fontSize: 12 }} />
                                                <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#4B5563'} tick={{ fontSize: 12 }} />
                                                <ReTooltip
                                                    cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                                    contentStyle={{
                                                        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                                                        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                                                        borderRadius: '8px',
                                                        color: theme === 'dark' ? '#fff' : '#111'
                                                    }}
                                                />
                                                <Legend />
                                                <Bar dataKey="dripAmount" name="Estimado con Reinv." fill="#3B82F6" stackId="a" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="amount" name="Estimado (Sin Reinv.)" fill="#10B981" stackId="b" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-sm">Añade activos para ver proyección</div>
                                )}
                            </div>

                            {/* Monthly Dividends (Current Year) - Expanded to full width */}
                            <div className={`lg:col-span-3 rounded-2xl border p-8 flex flex-col items-center justify-center min-h-[500px] ${bgClass}`}>
                                <h3 className={`font-bold mb-4 w-full text-left ${textClass}`}>Calendario de Pagos</h3>
                                {selectedPortfolio.holdings.length > 0 ? (
                                    <div className="w-full h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={(() => {
                                                const monthlyData = Array(12).fill(0).map((_, i) => ({
                                                    name: new Date(0, i).toLocaleString('es-ES', { month: 'short' }),
                                                    amount: 0,
                                                    monthIndex: i
                                                }));

                                                selectedPortfolio.holdings.forEach(h => {
                                                    const divs = dividendsData[h.symbol] || [];
                                                    // Estimate based on previous payments mapping to months
                                                    divs.forEach(d => {
                                                        // Logic: If a stock paid in Month X last year, it likely pays in Month X this year.
                                                        // We sum up the AMOUNTS from the LAST 12 MONTHS of data to populate the grid.
                                                        const divDate = new Date(d.date);
                                                        const now = new Date();
                                                        // Filter for "recent" historical payments (last 12-18 months) to guess schedule
                                                        // A bit naive but effective for V1
                                                        if (divDate.getFullYear() >= now.getFullYear() - 1) {
                                                            const month = divDate.getMonth();
                                                            monthlyData[month].amount += d.amount * h.shares;
                                                        }
                                                    });
                                                });

                                                // Normalize: If we have multiple years overlap, we might double count. 
                                                // Better logic: Find UNIQUE payments per Quarter/Year.
                                                // SIMPLIFIED V1: Just show "Last 12 Month Received" as a proxy for "Future 12 Months"

                                                return monthlyData;

                                            })()}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} vertical={false} />
                                                <XAxis dataKey="name" stroke={theme === 'dark' ? '#9CA3AF' : '#4B5563'} tick={{ fontSize: 12 }} />
                                                <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#4B5563'} tick={{ fontSize: 12 }} />
                                                <ReTooltip
                                                    cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                                    contentStyle={{
                                                        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                                                        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                                                        borderRadius: '8px',
                                                        color: theme === 'dark' ? '#fff' : '#111'
                                                    }}
                                                    formatter={(value) => `$${value.toFixed(2)}`}
                                                />
                                                <Bar dataKey="amount" name="Dividendos Estimados" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-sm">Añade activos para ver calendario</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            {showDebug && (
                <div className="mt-8 p-4 bg-black text-green-400 font-mono text-xs overflow-auto max-h-96 rounded-xl border border-green-500/30">
                    <h4 className="font-bold mb-2">DEBUG DATA (Raw API Response)</h4>
                    <pre>{JSON.stringify(currentPrices, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default PortfolioManager;
