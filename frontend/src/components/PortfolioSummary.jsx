import React, { useState, useEffect } from 'react';
import { getBatchQuotes } from '../api/client';
import { Wallet, TrendingUp, TrendingDown, ArrowRight, Plus } from 'lucide-react';

const PortfolioSummary = ({ portfolios = [], theme = 'dark', onViewPortfolio }) => {
    const [prices, setPrices] = useState({});

    // Select the first portfolio as "Main" or handle empty
    const mainPortfolio = portfolios.length > 0 ? portfolios[0] : null;

    useEffect(() => {
        if (!mainPortfolio) return;

        const fetchPrices = async () => {
            const symbols = [...new Set(mainPortfolio.holdings.map(h => h.symbol))];
            if (symbols.length === 0) return;

            try {
                const data = await getBatchQuotes(symbols);
                setPrices(data);
            } catch (error) {
                console.error("Error fetching portfolio prices", error);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 60000);
        return () => clearInterval(interval);
    }, [mainPortfolio]);

    if (!mainPortfolio) {
        return (
            <div className={`rounded-xl border p-6 text-center ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="p-3 bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="text-blue-400" size={24} />
                </div>
                <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mi Portafolio</h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Crea tu primer portafolio para ver tus inversiones aquí.</p>
                <button
                    onClick={onViewPortfolio}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} /> Crear
                </button>
            </div>
        );
    }

    // Calculate Stats
    let totalInvested = 0;
    let totalCurrent = 0;

    mainPortfolio.holdings.forEach(h => {
        totalInvested += (h.shares * h.price) + (h.fees || 0);
        const price = prices[h.symbol]?.price || h.price;
        totalCurrent += h.shares * price;
    });

    const totalGain = totalCurrent - totalInvested;
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
    const isPositive = totalGain >= 0;

    return (
        <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="p-5 border-b border-dashed border-gray-500/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Wallet size={18} className="text-blue-400" />
                        <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{mainPortfolio.name}</h3>
                    </div>
                </div>

                <div>
                    <p className={`text-xs uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Valor Total</p>
                    <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>${totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                    <div className={`flex items-center mt-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                        <span>{isPositive ? '+' : ''}${totalGain.toLocaleString()} ({totalGainPercent.toFixed(2)}%)</span>
                    </div>
                </div>
            </div>

            <div className="p-4">
                <h4 className={`text-xs font-bold uppercase mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Top Activos</h4>
                <div className="space-y-3">
                    {mainPortfolio.holdings.slice(0, 5).map((h, i) => {
                        const price = prices[h.symbol]?.price || h.price;
                        const val = h.shares * price;
                        const change = prices[h.symbol]?.changePercent || 0;
                        return (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <div className="font-medium text-blue-400">{h.symbol}</div>
                                <div className="text-right">
                                    <div className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>${val.toLocaleString()}</div>
                                    <div className={`text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={onViewPortfolio}
                    className={`w-full mt-4 flex items-center justify-center gap-1 text-xs font-bold uppercase py-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900'}`}
                >
                    Ver Todo <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default PortfolioSummary;
