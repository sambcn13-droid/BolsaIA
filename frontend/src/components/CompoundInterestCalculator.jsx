import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, DollarSign, Calendar, Landmark, Percent, Table } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const CompoundInterestCalculator = ({ theme, onBack }) => {
    const isDark = theme === 'dark';

    const [initialAmount, setInitialAmount] = useState(1000);
    const [monthlyContribution, setMonthlyContribution] = useState(100);
    const [years, setYears] = useState(10);
    const [interestRate, setInterestRate] = useState(7);
    const [compoundingFrequency, setCompoundingFrequency] = useState(12); // monthly
    const [inflationRate, setInflationRate] = useState(2);
    const [taxRate, setTaxRate] = useState(19);

    const [data, setData] = useState([]);
    const [totals, setTotals] = useState({ totalBalance: 0, totalContributions: 0, totalInterest: 0 });

    const calculate = () => {
        let currentBalance = initialAmount;
        let totalInvested = initialAmount;
        const newData = [];
        const monthlyRate = interestRate / 100 / 12;
        const annualInflation = inflationRate / 100;

        newData.push({
            year: 0,
            balance: Math.round(currentBalance),
            invested: Math.round(totalInvested),
            realValue: Math.round(currentBalance)
        });

        for (let i = 1; i <= years; i++) {
            for (let m = 1; m <= 12; m++) {
                // Apply interest (monthly compounding simplified for UI)
                currentBalance *= (1 + (interestRate / 100 / compoundingFrequency) * (compoundingFrequency / 12));
                currentBalance += monthlyContribution;
                totalInvested += monthlyContribution;
            }

            // Calculate real value (inflation adjusted)
            const realValue = currentBalance / Math.pow(1 + annualInflation, i);

            newData.push({
                year: i,
                balance: Math.round(currentBalance),
                invested: Math.round(totalInvested),
                realValue: Math.round(realValue)
            });
        }

        const finalBalance = currentBalance;
        const totalInterest = finalBalance - totalInvested;
        const afterTaxInterest = totalInterest * (1 - taxRate / 100);

        setData(newData);
        setTotals({
            totalBalance: Math.round(finalBalance),
            totalContributions: Math.round(totalInvested),
            totalInterest: Math.round(totalInterest),
            netBalance: Math.round(totalInvested + afterTaxInterest)
        });
    };

    useEffect(() => {
        calculate();
    }, [initialAmount, monthlyContribution, years, interestRate, compoundingFrequency, inflationRate, taxRate]);

    const cardClass = isDark
        ? "bg-gray-900/40 backdrop-blur-xl border border-yellow-500/20 shadow-2xl rounded-2xl p-6"
        : "bg-white/80 backdrop-blur-xl border border-yellow-200 shadow-xl rounded-2xl p-6";

    const inputClass = isDark
        ? "bg-black/40 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-yellow-500 text-white w-full"
        : "bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-yellow-500 text-gray-900 w-full";

    const labelClass = isDark ? "text-gray-400 text-xs mb-1 block uppercase tracking-wider font-bold" : "text-gray-600 text-xs mb-1 block uppercase tracking-wider font-bold";

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-yellow-600 hover:text-yellow-500 transition-colors">
                    <ArrowLeft size={20} />
                    <span className="font-semibold">Volver</span>
                </button>
                <h2 className={`text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600`}>
                    Interés Compuesto PRO
                </h2>
                <div className="w-20"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* INPUTS COLUMN */}
                <div className={cardClass}>
                    <h3 className="text-xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
                        <Landmark size={20} /> Parámetros
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Capital Inicial (€)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">€</span>
                                <input type="number" value={initialAmount} onChange={e => setInitialAmount(Number(e.target.value))} className={`${inputClass} pl-8`} />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Aportación Mensual (€)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">€</span>
                                <input type="number" value={monthlyContribution} onChange={e => setMonthlyContribution(Number(e.target.value))} className={`${inputClass} pl-8`} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Años</label>
                                <input type="number" value={years} onChange={e => setYears(Number(e.target.value))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Interés Anual (%)</label>
                                <input type="number" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className={inputClass} />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Frecuencia de Capitalización</label>
                            <select value={compoundingFrequency} onChange={e => setCompoundingFrequency(Number(e.target.value))} className={inputClass}>
                                <option value={12}>Mensual</option>
                                <option value={4}>Trimestral</option>
                                <option value={1}>Anual</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-gray-700/50">
                            <h4 className="text-sm font-bold text-gray-500 mb-3">OPCIONES AVANZADAS</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Inflación (%)</label>
                                    <input type="number" value={inflationRate} onChange={e => setInflationRate(Number(e.target.value))} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Impuestos (%)</label>
                                    <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className={inputClass} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RESULTS & CHART COLUMN */}
                <div className="lg:col-span-2 space-y-8">
                    {/* STATS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={`${cardClass} flex flex-col items-center justify-center py-4`}>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Saldo Final</span>
                            <span className="text-2xl font-black text-yellow-500">€{totals.totalBalance.toLocaleString()}</span>
                        </div>
                        <div className={`${cardClass} flex flex-col items-center justify-center py-4`}>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Total Invertido</span>
                            <span className="text-2xl font-black text-blue-500">€{totals.totalContributions.toLocaleString()}</span>
                        </div>
                        <div className={`${cardClass} flex flex-col items-center justify-center py-4`}>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Intereses Brutos</span>
                            <span className="text-2xl font-black text-green-500">€{totals.totalInterest.toLocaleString()}</span>
                        </div>
                        <div className={`${cardClass} flex flex-col items-center justify-center py-4 border-l-4 border-l-red-500`}>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Real (Inflación)</span>
                            <span className="text-2xl font-black text-red-500">€{data[data.length - 1]?.realValue.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* CHART */}
                    <div className={`${cardClass} h-[400px]`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp size={20} className="text-yellow-500" /> Proyección Temporal
                            </h3>
                            <div className="flex gap-4 text-[10px] uppercase font-bold">
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Invertido</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Total</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Valor Real</div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height="90%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#ddd"} vertical={false} />
                                <XAxis dataKey="year" stroke={isDark ? "#888" : "#666"} fontSize={12} label={{ value: 'Años', position: 'insideBottom', offset: -5 }} />
                                <YAxis stroke={isDark ? "#888" : "#666"} fontSize={12} tickFormatter={val => `€${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: isDark ? '#000' : '#fff', border: '1px solid #444', borderRadius: '8px' }}
                                    formatter={(value) => [`€${value.toLocaleString()}`, '']}
                                    labelFormatter={(year) => `Año ${year}`}
                                />
                                <Area type="monotone" dataKey="balance" stroke="#eab308" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={3} />
                                <Area type="monotone" dataKey="invested" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInvested)" strokeWidth={2} />
                                <Line type="monotone" dataKey="realValue" stroke="#ef4444" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* NET RECAP */}
                    <div className={`${cardClass} bg-gradient-to-r from-yellow-500/10 to-transparent flex items-center justify-between`}>
                        <div>
                            <h4 className="text-sm font-bold uppercase text-gray-500 tracking-widest">Saldo Neto Estimado (Tras Impuestos)</h4>
                            <p className="text-3xl font-black text-yellow-500">€{totals.netBalance?.toLocaleString() || 0}</p>
                        </div>
                        <div className="text-right">
                            <Landmark size={40} className="text-yellow-600/50" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompoundInterestCalculator;
