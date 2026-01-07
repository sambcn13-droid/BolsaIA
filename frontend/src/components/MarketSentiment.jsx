import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const MarketSentiment = ({ data, theme }) => {
    if (!data) return null;

    const { value, index, summary, vix } = data;

    // Helper to get color text based on value
    const getSentimentColor = (val) => {
        if (val < 25) return "text-red-500";
        if (val < 45) return "text-orange-500";
        if (val < 55) return "text-gray-400";
        if (val < 75) return "text-blue-500";
        return "text-green-500";
    };

    const containerClass = `mx-auto max-w-4xl mb-6 p-4 rounded-2xl backdrop-blur-xl border shadow-xl ${theme === 'dark'
        ? 'bg-black/30 border-white/10'
        : 'bg-white/70 border-white/40'
        }`;

    const cardClass = `flex flex-col p-3 rounded-xl transition-all hover:scale-[1.02] border ${theme === 'dark'
        ? 'bg-white/5 border-white/10 hover:bg-white/10'
        : 'bg-white border-gray-100 hover:bg-gray-50 shadow-sm'
        }`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={containerClass}
        >
            <div className="flex items-center justify-between mb-3">
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Sentimiento del Mercado
                </h2>
                <div className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                    Tiempo Real
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* 1. CNN Fear & Greed */}
                <a
                    href="https://edition.cnn.com/markets/fear-and-greed"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClass}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            CNN Fear & Greed
                        </span>
                        <ExternalLink size={16} className="text-gray-400" />
                    </div>
                    <div className="mt-auto">
                        <div className={`text-3xl font-black ${getSentimentColor(value)}`}>
                            {value}
                        </div>
                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {(() => {
                                const map = { "Extreme Fear": "Miedo Extremo", "Fear": "Miedo", "Neutral": "Neutral", "Greed": "Codicia", "Extreme Greed": "Codicia Extrema" };
                                return map[index] || map[index?.replace("Extreme ", "Ext. ")] || index;
                            })()}
                        </div>
                    </div>
                </a>

                {/* 2. AAII Sentiment */}
                <a
                    href="https://www.aaii.com/sentimentsurvey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClass}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Inversores AAII
                        </span>
                        <ExternalLink size={16} className="text-gray-400" />
                    </div>
                    <div className="mt-auto space-y-2">
                        {data.aaii ? (
                            <>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-500 font-bold">Alcista</span>
                                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{data.aaii.bullish}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-500 font-bold">Bajista</span>
                                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{data.aaii.bearish}%</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-xs text-gray-500 italic py-2">
                                Encuesta no disponible
                            </div>
                        )}
                    </div>
                </a>

                {/* 3. VIX (Yahoo Finance) */}
                <a
                    href="https://finance.yahoo.com/quote/%5EVIX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClass}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Volatilidad (VIX)
                        </span>
                        <ExternalLink size={16} className="text-gray-400" />
                    </div>
                    <div className="mt-auto">
                        {vix > 0 ? (
                            <div className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {vix}
                            </div>
                        ) : (
                            <div className="text-sm font-medium text-blue-500 py-2">
                                Ver en Yahoo Finance ↗
                            </div>
                        )}
                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Índice de Miedo
                        </div>
                    </div>
                </a>

            </div>
        </motion.div>
    );
};

export default MarketSentiment;
