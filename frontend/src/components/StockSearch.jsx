
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

const StockSearch = ({ onSearch, theme = 'dark' }) => {
    const [symbol, setSymbol] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSearchChange = async (e) => {
        const value = e.target.value;
        setSymbol(value);

        if (value.length >= 1) {
            try {
                // Dynamic import to avoid circular dependency if any, strictly speaking not needed but good practice
                const { searchStocks } = await import('../api/client');
                const results = await searchStocks(value);
                setSuggestions(results);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Search error", error);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectSymbol = (selectedSymbol) => {
        setSymbol(selectedSymbol);
        setShowSuggestions(false);
        onSearch(selectedSymbol);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (symbol.trim()) {
            onSearch(symbol.toUpperCase());
            setShowSuggestions(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto mb-8 relative z-50"
        >
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={symbol}
                    onChange={handleSearchChange}
                    placeholder="Buscar acción o empresa (ej. Apple, QQQ3)..."
                    className={`w-full px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xl transition-all ${theme === 'dark'
                        ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400'
                        : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-500'
                        }`}
                />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors shadow-lg"
                >
                    <Search size={20} />
                </button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
                <div className={`absolute w-full mt-2 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto ${theme === 'dark'
                    ? 'bg-gray-900/95 border-white/10'
                    : 'bg-white border-gray-200'
                    }`}>
                    {suggestions.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelectSymbol(item.symbol)}
                            className={`px-6 py-3 cursor-pointer transition-colors border-b last:border-0 ${theme === 'dark'
                                ? 'hover:bg-white/10 border-white/5'
                                : 'hover:bg-gray-50 border-gray-100'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.symbol}</span>
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{item.exchange}</span>
                            </div>
                            <div className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{item.name}</div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default StockSearch;
