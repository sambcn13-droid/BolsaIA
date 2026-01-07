import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowLeft, MoreVertical, Folder, X, RefreshCw } from 'lucide-react';
import { getBatchQuotes } from '../api/client';

const COLORS = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Amarillo', value: '#F59E0B' },
    { name: 'Púrpura', value: '#8B5CF6' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Cian', value: '#06B6D4' },
    { name: 'Gris', value: '#6B7280' },
];

const WatchlistsManager = ({ watchlists, onUpdateWatchlists, onSelectSymbol, onBack, theme = 'dark' }) => {
    const [newListName, setNewListName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [quotes, setQuotes] = useState({});
    const [loadingQuotes, setLoadingQuotes] = useState(false);

    // Fetch quotes for all symbols in all lists
    const fetchAllQuotes = async () => {
        const allSymbols = new Set();
        watchlists.forEach(list => {
            list.symbols.forEach(sym => allSymbols.add(sym));
        });

        const symbolsArray = Array.from(allSymbols);
        if (symbolsArray.length === 0) return;

        setLoadingQuotes(true);
        const data = await getBatchQuotes(symbolsArray);
        setQuotes(data);
        setLoadingQuotes(false);
    };

    useEffect(() => {
        fetchAllQuotes();
        // Refresh every 30 seconds
        const interval = setInterval(fetchAllQuotes, 30000);
        return () => clearInterval(interval);
    }, [watchlists]); // Re-fetch if watchlists change (added/removed symbols)

    const handleCreateList = (e) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        const newList = {
            id: Date.now().toString(),
            name: newListName,
            color: selectedColor,
            symbols: []
        };

        onUpdateWatchlists([...watchlists, newList]);
        setNewListName('');
        setShowCreateForm(false);
    };

    const handleDeleteList = (listId) => {
        if (window.confirm('¿Seguro que quieres borrar esta lista?')) {
            onUpdateWatchlists(watchlists.filter(w => w.id !== listId));
        }
    };

    const [inputValues, setInputValues] = useState({});

    const handleAddSymbol = (listId) => {
        const symbolToAdd = inputValues[listId]?.trim();
        if (!symbolToAdd) return;

        const updatedLists = watchlists.map(list => {
            if (list.id === listId) {
                // Prevent duplicates
                if (list.symbols.includes(symbolToAdd)) return list;
                return { ...list, symbols: [...list.symbols, symbolToAdd] };
            }
            return list;
        });

        onUpdateWatchlists(updatedLists);
        setInputValues(prev => ({ ...prev, [listId]: '' }));
    };

    const handleRemoveSymbol = (listId, symbol) => {
        const updatedLists = watchlists.map(list => {
            if (list.id === listId) {
                return { ...list, symbols: list.symbols.filter(s => s !== symbol) };
            }
            return list;
        });
        onUpdateWatchlists(updatedLists);
    };

    const bgClass = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm';
    const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const subTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

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
                <h2 className={`text-3xl font-bold ${textClass}`}>Mis Listas</h2>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Nueva Lista</span>
                </button>
            </div>

            {/* Create Form Modal */}
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
                            <h3 className={`text-xl font-bold mb-4 ${textClass}`}>Crear Nueva Lista</h3>
                            <form onSubmit={handleCreateList} className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${subTextClass}`}>Nombre</label>
                                    <input
                                        type="text"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder="Ej. Tecnológicas, Largo Plazo..."
                                        className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${subTextClass}`}>Color Identificativo</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map(color => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setSelectedColor(color.value)}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color.value ? 'border-white ring-2 ring-blue-500' : 'border-transparent'}`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
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
                                        Crear Lista
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lists Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {watchlists.map((list) => (
                    <motion.div
                        key={list.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`rounded-2xl border overflow-hidden flex flex-col h-full ${bgClass}`}
                        style={{ borderTop: `4px solid ${list.color}` }}
                    >
                        <div className="p-5 flex justify-between items-start border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <Folder className="text-gray-400" size={20} />
                                <div>
                                    <h3 className={`font-bold text-lg ${textClass}`}>{list.name}</h3>
                                    <p className={`text-xs ${subTextClass}`}>{list.symbols.length} acciones</p>
                                </div>
                            </div>
                            {list.id !== 'default' && (
                                <button
                                    onClick={() => handleDeleteList(list.id)}
                                    className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400' : 'hover:bg-red-100 text-gray-400 hover:text-red-500'}`}
                                    title="Eliminar lista"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                            {list.symbols.length === 0 ? (
                                <div className={`text-center py-8 ${subTextClass} opacity-60`}>
                                    <p>Lista vacía</p>
                                    <p className="text-xs mt-1">Añade acciones abajo</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {list.symbols.map(symbol => (
                                        <div key={symbol} className={`flex items-center justify-between p-3 rounded-xl group transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100'}`}>
                                            <button
                                                onClick={() => onSelectSymbol(symbol)}
                                                className={`flex-1 text-left font-bold ${textClass} hover:text-blue-500 transition-colors`}
                                            >
                                                <div className="flex justify-between items-center w-full pr-2">
                                                    <span>{symbol}</span>
                                                    {quotes[symbol] && !quotes[symbol].error && (
                                                        <div className="text-right">
                                                            <div className={`text-sm ${textClass}`}>${quotes[symbol].price?.toFixed(2)}</div>
                                                            <div className={`text-xs ${quotes[symbol].change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                {quotes[symbol].change >= 0 ? '+' : ''}{quotes[symbol].change?.toFixed(2)}%
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleRemoveSymbol(list.id, symbol)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-all shrink-0"
                                                title="Quitar de la lista"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Symbol Input */}
                        <div className={`p-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Añadir símbolo..."
                                    value={inputValues[list.id] || ''}
                                    onChange={(e) => setInputValues(prev => ({ ...prev, [list.id]: e.target.value.toUpperCase() }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol(list.id)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                                />
                                <button
                                    onClick={() => handleAddSymbol(list.id)}
                                    disabled={!inputValues[list.id]}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default WatchlistsManager;
