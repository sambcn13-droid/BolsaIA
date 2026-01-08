import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowLeft, Percent, TrendingUp, TrendingDown, HelpCircle, RefreshCcw } from 'lucide-react';

const PercentageCalculator = ({ theme, onBack }) => {
    const [activeTab, setActiveTab] = useState('change');
    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');
    const [result, setResult] = useState(null);

    const isDark = theme === 'dark';

    const calculateChange = () => {
        const v1 = parseFloat(val1);
        const v2 = parseFloat(val2);
        if (isNaN(v1) || isNaN(v2) || v1 === 0) return;
        const diff = ((v2 - v1) / v1) * 100;
        setResult(diff.toFixed(2));
    };

    const calculateWhatIs = () => {
        const p = parseFloat(val1);
        const v = parseFloat(val2);
        if (isNaN(p) || isNaN(v)) return;
        const res = (p / 100) * v;
        setResult(res.toLocaleString(undefined, { maximumFractionDigits: 2 }));
    };

    const calculateRatio = () => {
        const x = parseFloat(val1);
        const y = parseFloat(val2);
        if (isNaN(x) || isNaN(y) || y === 0) return;
        const res = (x / y) * 100;
        setResult(res.toFixed(2));
    };

    const calculateAddSub = (type) => {
        const v = parseFloat(val1);
        const p = parseFloat(val2);
        if (isNaN(v) || isNaN(p)) return;
        const factor = type === 'add' ? (1 + p / 100) : (1 - p / 100);
        setResult((v * factor).toLocaleString(undefined, { maximumFractionDigits: 2 }));
    };

    const reset = () => {
        setVal1('');
        setVal2('');
        setResult(null);
    };

    const tabs = [
        { id: 'change', label: 'Variación %', icon: <TrendingUp size={18} />, desc: 'Calcula el cambio porcentual entre dos valores' },
        { id: 'whatis', label: '¿Cuánto es %?', icon: <Percent size={18} />, desc: 'Calcula el valor de un porcentaje determinado' },
        { id: 'ratio', label: 'Qué % es X de Y', icon: <HelpCircle size={18} />, desc: 'Calcula qué porcentaje representa un valor de otro' },
        { id: 'addsub', label: 'Sumar/Restar %', icon: <Calculator size={18} />, desc: 'Suma o resta un porcentaje a un valor base' },
    ];

    return (
        <div className="max-w-md mx-auto py-4 px-2 sm:px-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={onBack}
                    className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-yellow-500' : 'hover:bg-black/5 text-yellow-600'}`}
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="text-center">
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Calculadora <span className="text-yellow-500">Pro</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">Herramientas Financieras</p>
                </div>
                <button
                    onClick={reset}
                    className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'}`}
                >
                    <RefreshCcw size={20} />
                </button>
            </div>

            {/* Tab Selector (Scrollable horizontally on very small screens) */}
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6 snap-x">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); reset(); }}
                        className={`flex-shrink-0 snap-start flex flex-col items-center gap-2 p-3 rounded-2xl min-w-[85px] transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-yellow-500 text-white shadow-[0_8px_20px_-4px_rgba(234,179,8,0.5)] scale-105'
                                : isDark
                                    ? 'bg-gray-900/40 text-gray-400 border border-white/5 hover:border-yellow-500/30'
                                    : 'bg-white text-gray-500 border border-gray-100 shadow-sm hover:border-yellow-500/30'
                            }`}
                    >
                        <div className={`p-2 rounded-xl ${activeTab === tab.id ? 'bg-white/20' : isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            {tab.icon}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
                    </button>
                ))}
            </div>

            {/* Main Content Card */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-500 ${isDark
                        ? 'bg-gray-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl'
                        : 'bg-white/90 backdrop-blur-2xl border border-gray-100 shadow-xl'
                    }`}
            >
                {/* Decoration */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-yellow-500/10 rounded-full blur-3xl"></div>

                <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {tabs.find(t => t.id === activeTab).label}
                </h3>
                <p className="text-[11px] text-gray-500 mb-6 leading-relaxed">
                    {tabs.find(t => t.id === activeTab).desc}
                </p>

                <div className="space-y-5">
                    {activeTab === 'change' && (
                        <div className="grid gap-4">
                            <InputGroup label="Valor Inicial" value={val1} onChange={setVal1} isDark={isDark} placeholder="1.000" />
                            <InputGroup label="Valor Final" value={val2} onChange={setVal2} isDark={isDark} placeholder="1.250" />
                            <CalcButton onClick={calculateChange} label="Calcular Cambio" />
                        </div>
                    )}

                    {activeTab === 'whatis' && (
                        <div className="grid gap-4">
                            <InputGroup label="Porcentaje" value={val1} onChange={setVal1} isDark={isDark} placeholder="21" suffix="%" />
                            <InputGroup label="Del Total" value={val2} onChange={setVal2} isDark={isDark} placeholder="500" />
                            <CalcButton onClick={calculateWhatIs} label="Calcular Valor" />
                        </div>
                    )}

                    {activeTab === 'ratio' && (
                        <div className="grid gap-4">
                            <InputGroup label="Valor X" value={val1} onChange={setVal1} isDark={isDark} placeholder="50" />
                            <InputGroup label="Valor Y (Total)" value={val2} onChange={setVal2} isDark={isDark} placeholder="200" />
                            <CalcButton onClick={calculateRatio} label="Ver Porcentaje" />
                        </div>
                    )}

                    {activeTab === 'addsub' && (
                        <div className="grid gap-4">
                            <InputGroup label="Precio Base" value={val1} onChange={setVal1} isDark={isDark} placeholder="100.00" />
                            <InputGroup label="Ajuste %" value={val2} onChange={setVal2} isDark={isDark} placeholder="15" suffix="%" />
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <button
                                    onClick={() => calculateAddSub('add')}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500/10 text-green-500 font-bold text-sm border border-green-500/20 hover:bg-green-500 hover:text-white transition-all active:scale-95"
                                >
                                    <TrendingUp size={16} /> Sumar
                                </button>
                                <button
                                    onClick={() => calculateAddSub('sub')}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500/10 text-red-500 font-bold text-sm border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                >
                                    <TrendingDown size={16} /> Restar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Result Display */}
                <AnimatePresence mode="wait">
                    {result !== null && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: 10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-8 pt-8 border-t border-gray-700/10 text-center"
                        >
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Resultado final</span>
                            <div className="mt-2 flex items-baseline justify-center gap-1">
                                <motion.span
                                    className="text-5xl font-black text-yellow-500 tracking-tighter"
                                    layoutId="result"
                                >
                                    {result}
                                </motion.span>
                                {(activeTab === 'change' || activeTab === 'ratio') && (
                                    <span className="text-2xl font-bold text-yellow-500/60">%</span>
                                )}
                            </div>

                            {activeTab === 'change' && (
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold mt-4 ${parseFloat(result) >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {parseFloat(result) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {parseFloat(result) >= 0 ? 'CRECIMIENTO' : 'DECRECIMIENTO'}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Quick Tips */}
            <div className={`mt-6 p-4 rounded-2xl border ${isDark ? 'bg-gray-900/20 border-white/5' : 'bg-gray-50 border-gray-200'} flex items-start gap-3`}>
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                    <HelpCircle size={16} />
                </div>
                <div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tip Profesional</h4>
                    <p className="text-[10px] text-gray-500 mt-1">Usa esta herramienta para calcular stop-losses, objetivos de ganancias o el peso de una acción en tu cartera.</p>
                </div>
            </div>
        </div>
    );
};

// Sub-components for cleaner code
const InputGroup = ({ label, value, onChange, isDark, placeholder, suffix }) => (
    <div className="space-y-1.5">
        <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {label}
        </label>
        <div className="relative group">
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full px-5 py-3.5 rounded-2xl font-bold transition-all outline-none border ${isDark
                        ? 'bg-black/60 border-white/5 focus:border-yellow-500/50 text-white placeholder:text-gray-700'
                        : 'bg-gray-50 border-gray-100 focus:border-yellow-500/50 text-gray-900 placeholder:text-gray-300'
                    }`}
            />
            {suffix && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                    {suffix}
                </div>
            )}
        </div>
    </div>
);

const CalcButton = ({ onClick, label }) => (
    <button
        onClick={onClick}
        className="w-full mt-2 py-4 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-white font-black text-xs uppercase tracking-widest shadow-[0_8px_30px_-5px_rgba(234,179,8,0.4)] transition-all active:scale-95"
    >
        {label}
    </button>
);

export default PercentageCalculator;
