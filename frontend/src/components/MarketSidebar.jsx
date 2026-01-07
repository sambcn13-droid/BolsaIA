import React, { useState, useEffect } from 'react';
import { getBatchQuotes } from '../api/client';
import { TrendingUp, TrendingDown, Activity, DollarSign, Zap, Bitcoin } from 'lucide-react';

const MarketSidebar = ({ theme = 'dark', onSelect }) => {
    const [prices, setPrices] = useState({});
    const [loading, setLoading] = useState(true);

    const SECTIONS = [
        {
            title: 'Índices Futuros',
            icon: Activity,
            items: [
                { symbol: 'ES=F', label: 'S&P 500' },
                { symbol: 'NQ=F', label: 'Nasdaq 100' },
                { symbol: 'RTY=F', label: 'Russell 2000' },
                { symbol: '^GDAXI', label: 'DAX 40' },
                { symbol: '^IBEX', label: 'IBEX 35' },
            ]
        },
        {
            title: 'Materias Primas',
            icon: Zap, // Or a better icon
            items: [
                { symbol: 'GC=F', label: 'Oro' },
                { symbol: 'SI=F', label: 'Plata' },
                { symbol: 'CL=F', label: 'Petróleo WTI' },
                { symbol: 'NG=F', label: 'Gas Natural' },
            ]
        },
        {
            title: 'Criptomonedas',
            icon: Bitcoin,
            items: [
                { symbol: 'BTC-USD', label: 'Bitcoin' },
                { symbol: 'ETH-USD', label: 'Ethereum' },
            ]
        }
    ];

    const allSymbols = SECTIONS.flatMap(s => s.items.map(i => i.symbol));

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const data = await getBatchQuotes(allSymbols);
                setPrices(data);
            } catch (error) {
                console.error("Error fetching market data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const formatPrice = (symbol, price) => {
        if (price === undefined || price === null) return '---';
        if (['^GDAXI', '^IBEX'].includes(symbol)) return price.toLocaleString('de-DE', { maximumFractionDigits: 2 });
        return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="space-y-6">
            {SECTIONS.map((section, idx) => (
                <div key={idx} className={`rounded-xl border p-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <section.icon size={18} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
                        <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{section.title}</h3>
                    </div>

                    <div className="space-y-3">
                        {section.items.map(item => {
                            const data = prices[item.symbol];
                            const isPositive = data?.change >= 0;

                            return (
                                <div
                                    key={item.symbol}
                                    onClick={() => onSelect && onSelect(item.symbol)}
                                    className={`flex justify-between items-center text-sm p-2 rounded-lg cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                                >
                                    <div>
                                        <div className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</div>
                                        {/* <div className="text-xs text-gray-500">{item.symbol}</div> */}
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {loading ? '...' : formatPrice(item.symbol, data?.price)}
                                        </div>
                                        <div className={`flex items-center justify-end text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                            {!loading && data && (
                                                <>
                                                    {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                                                    {data.change !== undefined ? `${data.change.toFixed(2)}%` : '0.00%'}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MarketSidebar;
