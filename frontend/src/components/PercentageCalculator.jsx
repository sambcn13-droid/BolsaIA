import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowLeft, Percent, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

const PercentageCalculator = ({ theme, onBack }) => {
    const [activeTab, setActiveTab] = useState('change');

    const isDark = theme === 'dark';

    const cardClass = isDark
        ? "bg-gray-900/40 backdrop-blur-xl border border-yellow-500/20 shadow-2xl rounded-2xl p-6"
        : "bg-white/80 backdrop-blur-xl border border-yellow-200 shadow-xl rounded-2xl p-6";

    const inputClass = isDark
        ? "bg-black/40 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 text-white w-full"
        : "bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 text-gray-900 w-full";

    const labelClass = isDark ? "text-gray-400 text-sm mb-2 block" : "text-gray-600 text-sm mb-2 block";

    // Calculator states
    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');
    const [result, setResult] = useState(null);

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
        setResult(res.toLocaleString());
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
        setResult((v * factor).toLocaleString());
    };

    const reset = () => {
        setVal1('');
        setVal2('');
        setResult(null);
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-yellow-600 hover:text-yellow-500 transition-colors">
                    <ArrowLeft size={20} />
                    <span className="font-semibold">Volver</span>
                </button>
                <h2 className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-600`}>
                    Calculadora de Porcentajes
                </h2>
                <div className="w-20"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { id: 'change', label: 'Variación %', icon: <TrendingUp size={18} /> },
                    { id: 'whatis', label: '¿Cuánto es %?', icon: <Percent size={18} /> },
                    { id: 'ratio', label: 'Qué % es X de Y', icon: <HelpCircle size={18} /> },
                    { id: 'addsub', label: 'Sumar/Restar %', icon: <Calculator size={18} /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); reset(); }}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all ${activeTab === tab.id
                                ? 'bg-yellow-500 text-white shadow-lg'
                                : isDark ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-800' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cardClass}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                        {activeTab === 'change' && (
                            <>
                                <div>
                                    <label className={labelClass}>Valor Inicial</label>
                                    <input type="number" value={val1} onChange={(e) => setVal1(e.target.value)} placeholder="0.00" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Valor Final</label>
                                    <input type="number" value={val2} onChange={(e) => setVal2(e.target.value)} placeholder="0.00" className={inputClass} />
                                </div>
                                <button onClick={calculateChange} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">
                                    Calcular Variación
                                </button>
                            </>
                        )}

                        {activeTab === 'whatis' && (
                            <>
                                <div>
                                    <label className={labelClass}>Porcentaje (%)</label>
                                    <input type="number" value={val1} onChange={(e) => setVal1(e.target.value)} placeholder="Ej: 20" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Del Valor Total</label>
                                    <input type="number" value={val2} onChange={(e) => setVal2(e.target.value)} placeholder="Ej: 500" className={inputClass} />
                                </div>
                                <button onClick={calculateWhatIs} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">
                                    Calcular Porcentaje
                                </button>
                            </>
                        )}

                        {activeTab === 'ratio' && (
                            <>
                                <div>
                                    <label className={labelClass}>Valor X</label>
                                    <input type="number" value={val1} onChange={(e) => setVal1(e.target.value)} placeholder="Ej: 50" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Es qué porcentaje de Y</label>
                                    <input type="number" value={val2} onChange={(e) => setVal2(e.target.value)} placeholder="Ej: 200" className={inputClass} />
                                </div>
                                <button onClick={calculateRatio} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">
                                    Calcular Proporción
                                </button>
                            </>
                        )}

                        {activeTab === 'addsub' && (
                            <>
                                <div>
                                    <label className={labelClass}>Valor de Base</label>
                                    <input type="number" value={val1} onChange={(e) => setVal1(e.target.value)} placeholder="0.00" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Porcentaje a aplicar (%)</label>
                                    <input type="number" value={val2} onChange={(e) => setVal2(e.target.value)} placeholder="Ej: 15" className={inputClass} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => calculateAddSub('add')} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
                                        <TrendingUp size={18} /> Sumar
                                    </button>
                                    <button onClick={() => calculateAddSub('sub')} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
                                        <TrendingDown size={18} /> Restar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="text-center md:border-l border-gray-700/50 md:pl-8 h-full flex flex-col justify-center min-h-[200px]">
                        <p className={labelClass}>Resultado</p>
                        {result !== null ? (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-5xl font-black text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                            >
                                {activeTab === 'change' || activeTab === 'ratio' ? `${result}%` : result}
                            </motion.div>
                        ) : (
                            <div className="text-gray-500 italic">Ingresa los valores y pulsa calcular</div>
                        )}

                        {result !== null && activeTab === 'change' && (
                            <p className={`mt-4 font-semibold ${parseFloat(result) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {parseFloat(result) >= 0 ? 'Crecimiento ↑' : 'Decrecimiento ↓'}
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PercentageCalculator;
