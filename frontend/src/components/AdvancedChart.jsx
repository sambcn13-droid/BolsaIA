import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const ExternalPlatformView = ({ theme, name, description, logo, url, buttonText }) => (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className={`max-w-2xl p-10 rounded-3xl shadow-2xl border ${theme === 'dark' ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-100'}`}>
            <img
                src={logo}
                alt={name}
                className="w-auto h-16 mx-auto mb-8 object-contain"
            />
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{name}</h2>
            <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {description}
            </p>

            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 transition-all transform hover:scale-105"
            >
                {buttonText}
                <ExternalLink size={24} />
            </a>
        </div>
    </div>
);

const AdvancedChart = ({ theme = 'light' }) => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const container = useRef();
    const [platform, setPlatform] = useState('tradingview'); // 'tradingview', 'prorealtime', 'yahoo', 'investing'

    // Helper to convert Yahoo Finance symbols (e.g., QQQ3.MI) to TradingView (e.g., MIL:QQQ3)
    const formatSymbolForTradingView = (sym) => {
        if (!sym) return "NASDAQ:AAPL";

        // Common European/Global mappings
        if (sym.includes('.MI')) return `MIL:${sym.split('.')[0]}`; // Milan
        if (sym.includes('.MC')) return `BME:${sym.split('.')[0]}`; // Madrid
        if (sym.includes('.PA')) return `EURONEXT:${sym.split('.')[0]}`; // Paris
        if (sym.includes('.DE')) return `XETR:${sym.split('.')[0]}`; // Xetra (Germany)
        if (sym.includes('.L')) return `LSE:${sym.split('.')[0]}`; // London
        if (sym.includes('.AS')) return `EURONEXT:${sym.split('.')[0]}`; // Amsterdam

        // Fallback for others
        return sym;
    };

    // TradingView Widget Effect - Only run if platform is tradingview
    useEffect(() => {
        if (platform !== 'tradingview') return;

        const widgetSymbol = formatSymbolForTradingView(symbol);

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": widgetSymbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": theme,
            "style": "1",
            "locale": "es",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "support_host": "https://www.tradingview.com"
        });

        // Slight delay to ensure container is ready
        setTimeout(() => {
            if (container.current) {
                container.current.innerHTML = '';
                container.current.appendChild(script);
            }
        }, 100);

    }, [symbol, theme, platform]);

    const platforms = [
        { id: 'tradingview', label: 'TradingView' },
        { id: 'prorealtime', label: 'ProRealTime' },
        { id: 'yahoo', label: 'Yahoo Finance' },
        { id: 'investing', label: 'Investing.com' }
    ];

    return (
        <div className={`h-screen w-full flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Header / Back Button / Platform Selector */}
            <div className={`relative z-50 p-4 border-b flex flex-col xl:flex-row items-center justify-between gap-4 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>

                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${theme === 'dark'
                                ? 'bg-white/5 hover:bg-white/10 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                            }`}
                    >
                        <ArrowLeft size={20} />
                        <span className="hidden sm:inline">Volver</span>
                    </button>
                    <h1 className={`text-xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Análisis: <span className="text-blue-500">{symbol}</span>
                    </h1>
                </div>

                {/* Platform Toggle */}
                <div className={`flex flex-wrap justify-center gap-1 p-1 rounded-lg border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                    {platforms.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setPlatform(p.id)}
                            className={`px-3 py-1.5 rounded-md font-medium text-sm transition-all ${platform === p.id
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full relative bg-gray-50/5">
                {platform === 'tradingview' && (
                    <div className="w-full h-full relative" ref={container}>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    </div>
                )}

                {platform === 'prorealtime' && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                        <div className={`max-w-2xl p-10 rounded-3xl shadow-2xl border ${theme === 'dark' ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-100'}`}>
                            <img
                                src="https://assets.prorealtime.com/images/workstation/web@2x.f186f7be.webp"
                                alt="ProRealTime Workstation"
                                className="w-full max-w-lg mx-auto mb-8 rounded-lg shadow-lg"
                            />
                            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Plataforma Externa ProRealTime</h2>
                            <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                ProRealTime ofrece una suite profesional para análisis técnico avanzado.
                                Para usarla, accede directamente a su plataforma web oficial.
                            </p>

                            <a
                                href="https://www.prorealtime.com/es/web"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 transition-all transform hover:scale-105"
                            >
                                Abrir ProRealTime Web
                                <ExternalLink size={24} />
                            </a>
                        </div>
                    </div>
                )}

                {platform === 'yahoo' && (
                    <ExternalPlatformView
                        theme={theme}
                        name="Yahoo Finance"
                        description="Accede a datos financieros detallados, noticias y gráficos interactivos en Yahoo Finance."
                        logo="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Yahoo%21_Finance_logo_2021.png/800px-Yahoo%21_Finance_logo_2021.png"
                        url={`https://finance.yahoo.com/quote/${symbol}`}
                        buttonText="Ver en Yahoo Finance"
                    />
                )}

                {platform === 'investing' && (
                    <ExternalPlatformView
                        theme={theme}
                        name="Investing.com"
                        description="Herramientas técnicas, análisis de mercado y gráficos en tiempo real en Investing.com."
                        logo="https://i-INVDN-com.investing.com/logos/investing-com-logo-black.png"
                        url={`https://www.investing.com/search/?q=${symbol}`}
                        buttonText="Buscar en Investing.com"
                    />
                )}
            </div>
        </div>
    );
};
export default AdvancedChart;
