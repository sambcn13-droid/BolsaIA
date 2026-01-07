
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.15:8000/api';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getQuote = async (symbol) => {
    try {
        const response = await apiClient.get(`/quote/${symbol}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching quote:", error);
        throw error;
    }
};

export const getChartData = async (symbol, period = '1mo', interval = '1d') => {
    try {
        const response = await apiClient.get(`/chart/${symbol}?period=${period}&interval=${interval}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching chart:", error);
        throw error;
    }
};

export const getNews = async (symbol) => {
    try {
        const response = await apiClient.get(`/news/${symbol}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching news:", error);
        throw error;
    }
};

export const searchStocks = async (query) => {
    try {
        const response = await apiClient.get(`/search?q=${query}`);
        return response.data;
    } catch (error) {
        console.error("Error searching stocks:", error);
        return [];
    }
};

export const getDividends = async (symbol) => {
    try {
        const response = await apiClient.get(`/dividends/${symbol}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching dividends:", error);
        return [];
    }
};

export const getBatchQuotes = async (symbols) => {
    try {
        const response = await apiClient.post('/quotes', { symbols });
        return response.data;
    } catch (error) {
        console.error("Error fetching batch quotes:", error);
        return {};
    }
};

export const getHistoricalPrice = async (symbol, date) => {
    try {
        const response = await apiClient.get(`/price-at-date/${symbol}/${date}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching historical price:", error);
        return null;
    }
};

export const getSentiment = async (symbol) => {
    try {
        const response = await apiClient.get(`/sentiment/${symbol}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching sentiment:", error);
        return null;
    }
};


export const getMarketSentiment = async () => {
    try {
        const response = await apiClient.get('/market-sentiment');
        return response.data;
    } catch (error) {
        console.error("Error fetching market sentiment:", error);
        return null;
    }
};

// --- Portfolio Persistence ---

export const getPortfolios = async () => {
    try {
        const response = await apiClient.get('/portfolios');
        return response.data;
    } catch (error) {
        console.error("Error fetching portfolios from backend:", error);
        return [];
    }
};

export const savePortfolios = async (portfolios) => {
    try {
        // Wrap in object to match Pydantic model { portfolios: [...] }
        const response = await apiClient.post('/portfolios', { portfolios });
        return response.data;
    } catch (error) {
        console.error("Error saving portfolios to backend:", error);
        return null;
    }
};
