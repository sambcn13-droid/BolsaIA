import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Minus, Cpu } from 'lucide-react';

const SentimentCard = ({ sentiment, isLoading, theme = 'dark' }) => {
    // Styles
    const bgClass = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg';
    const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const subTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-6 ${bgClass} flex items-center gap-4`}
            >
                <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center animate-pulse">
                        <Cpu className="text-blue-400 animate-spin-slow" size={24} />
                    </div>
                </div>
                <div>
                    <h3 className={`font-bold text-lg ${textClass}`}>Analizando Noticias...</h3>
                    <p className={`text-sm ${subTextClass}`}>BolsaIA está leyendo el mercado.</p>
                </div>
            </motion.div>
        );
    }

    if (!sentiment) return null;

    const { score, label, color, news_count } = sentiment;
    const isBull = color === 'green';
    const isBear = color === 'red';

    // Gauge rotation: 0 = -90deg, 50 = 0deg, 100 = 90deg
    // Map 0-100 to -90 to 90
    const rotation = (score / 100) * 180 - 90;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border overflow-hidden relative ${bgClass} group`}
        >
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${isBull ? 'bg-green-500' : isBear ? 'bg-red-500' : 'bg-gray-500'}`} />

            <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isBull ? 'bg-green-500/20' : isBear ? 'bg-red-500/20' : 'bg-gray-500/20'}`}>
                            <Brain className={isBull ? 'text-green-400' : isBear ? 'text-red-400' : 'text-gray-400'} size={24} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${textClass}`}>Sentimiento IA</h3>
                            <p className={`text-xs ${subTextClass}`}>Basado en {news_count} noticias</p>
                        </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isBull ? 'bg-green-500/20 text-green-400' : isBear ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {label}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                    <div className="text-center w-full">
                        {/* Gauge Visual */}
                        <div className="relative h-24 w-48 mx-auto flex items-end justify-center overflow-hidden mb-2">
                            {/* Arc Background */}
                            <div className="absolute w-40 h-40 rounded-full border-[12px] border-white/10 top-4" />

                            {/* Needle Wrapper (Rotates) */}
                            <div
                                className="absolute bottom-0 w-2 h-20 bg-gradient-to-t from-transparent to-blue-500 origin-bottom transition-all duration-1000 ease-out"
                                style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'bottom center', height: '100%' }}
                            >
                                <div className={`w-3 h-3 rounded-full absolute top-0 -left-0.5 ${isBull ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : isBear ? 'bg-red-400 shadow-[0_0_10px_#f87171]' : 'bg-gray-400'} `} />
                            </div>

                            <div className="absolute bottom-0 w-full text-center pb-2">
                                <span className={`text-3xl font-black ${isBull ? 'text-green-400' : isBear ? 'text-red-400' : 'text-gray-400'}`}>
                                    {score}
                                </span>
                                <span className="text-xs text-gray-500 block">/ 100</span>
                            </div>
                        </div>

                        {/* Summary and Recommendation */}
                        <p className={`text-sm font-medium mt-1 max-w-[90%] mx-auto italic ${textClass}`}>
                            "{sentiment.summary}"
                        </p>
                        {sentiment.recommendation && (
                            <div className={`mt-3 inline-block px-4 py-1 rounded-lg border ${sentiment.recommendation === 'Comprar' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                    sentiment.recommendation === 'Vender' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                        'bg-gray-500/10 border-gray-500/30 text-gray-400'
                                }`}>
                                Recomendación: <strong>{sentiment.recommendation}</strong>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SentimentCard;
