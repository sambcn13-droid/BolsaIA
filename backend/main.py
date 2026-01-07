from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import json
import requests
from deep_translator import GoogleTranslator
import os
from dotenv import load_dotenv
import google.generativeai as genai
from pydantic import BaseModel
from typing import List


# Load .env explicitly from the same directory as main.py
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, ".env")
load_dotenv(env_path)

# Configure Gemini
GEN_API_KEY = os.getenv("GEMINI_API_KEY")

print(f"--- BOLSA-IA DEBUG ---")
print(f"Loading environment from: {env_path}")
if GEN_API_KEY:
    print(f"API Key found: {GEN_API_KEY[:5]}... (Oculto)")
    try:
        genai.configure(api_key=GEN_API_KEY)
        print("Gemini Configured Successfully")
    except Exception as e:
        print(f"Gemini config error: {e}")
else:
    print("WARNING: GEMINI_API_KEY not found in .env")
print(f"----------------------")

app = FastAPI(title="BolsaIA API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

translator = GoogleTranslator(source='auto', target='es')


# Portfolio Persistence
PORTFOLIO_FILE = os.path.join(current_dir, "portfolios.json")

# Configure Supabase
from supabase import create_client, Client
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase Connected Successfully")
    except Exception as e:
        print(f"Supabase connection error: {e}")

def load_portfolios_from_file():
    # 1. Try Supabase first
    if supabase:
        try:
            response = supabase.table("portfolios_v2").select("data").eq("id", "current_portfolio").execute()
            if response.data:
                return response.data[0]["data"]
        except Exception as e:
            print(f"Supabase load error: {e}")
    
    # 2. Fallback to local file
    if not os.path.exists(PORTFOLIO_FILE):
        return []
    try:
        with open(PORTFOLIO_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading portfolios: {e}")
        return []

def save_portfolios_to_file(data):
    success = False
    # 1. Try Supabase
    if supabase:
        try:
            supabase.table("portfolios_v2").upsert({
                "id": "current_portfolio",
                "data": data
            }).execute()
            success = True
        except Exception as e:
            print(f"Supabase save error: {e}")
            
    # 2. Always backup to local file
    try:
        with open(PORTFOLIO_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            if not supabase: success = True
    except Exception as e:
        print(f"Error saving portfolios local: {e}")
        return False
        
    return success

@app.get("/api/portfolios")
def get_portfolios():
    """Retrieve all portfolios from backend storage"""
    return load_portfolios_from_file()

class PortfolioList(BaseModel):
    portfolios: List[dict]

@app.post("/api/portfolios")
def save_portfolios(data: PortfolioList):
    """Save all portfolios to backend storage (Overwrite)"""
    if save_portfolios_to_file(data.portfolios):
        return {"status": "success", "count": len(data.portfolios)}
    else:
        raise HTTPException(status_code=500, detail="Failed to save portfolios")

@app.get("/")
def read_root():
    return {"status": "active", "system": "BolsaIA Superintelligence"}

@app.get("/api/search")
def search_symbol(q: str):
    """Busca símbolos usando la API de Yahoo Finance"""
    try:
        # We removed &region=ES to allow global results like Visa (V) while still finding European stocks
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={q}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers)
        data = response.json()
        
        results = []
        if 'quotes' in data:
            for item in data['quotes']:
                if 'symbol' in item:
                    results.append({
                        "symbol": item['symbol'],
                        "name": item.get('longname') or item.get('shortname') or item['symbol'],
                        "type": item.get('quoteType', 'Unknown'),
                        "exchange": item.get('exchange', 'Unknown')
                    })
        return results
    except Exception as e:
        print(f"Search error: {e}")
        return []

@app.get("/api/quote/{symbol}")
def get_quote(symbol: str):
    """Obtiene datos en tiempo real de una acción"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Translate sector if exists
        sector = info.get("sector")
        if sector:
            try:
                sector = translator.translate(sector)
            except:
                pass

        # Currency logic with fallback for European markets
        currency = info.get("currency")
        
        # If missing or USD, check suffix to ensure correct currency for European/Global stocks
        if not currency or currency == "USD":
            suffix = symbol.split('.')[-1] if '.' in symbol else ""
            if suffix in ['MI', 'PA', 'MC', 'DE', 'AS', 'BR', 'LS', 'VI', 'IR']:
                currency = "EUR"
            elif suffix == 'L':
                currency = "GBP"
            elif suffix == 'TO':
                currency = "CAD"
            elif not currency:
                currency = "USD"

        # Extract key data safely
        data = {
            "symbol": symbol.upper(),
            "shortName": info.get("shortName"),
            "price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "change": info.get("regularMarketChangePercent"),
            "marketCap": info.get("marketCap"),
            "volume": info.get("volume"),
            "sector": sector,
            "website": info.get("website"),
            "logo_url": info.get("logo_url"),
            "trailingPE": info.get("trailingPE"),
            "forwardPE": info.get("forwardPE"),
            "dividendYield": info.get("dividendYield"),
            "dividendRate": info.get("dividendRate"),
            "currency": currency
        }
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error fetching data: {str(e)}")

@app.get("/api/dividends/{symbol}")
def get_dividends(symbol: str):
    """Obtiene el historial de dividendos"""
    try:
        ticker = yf.Ticker(symbol)
        dividends = ticker.dividends
        
        data = []
        if not dividends.empty:
            # Sort descending by date
            dividends = dividends.sort_index(ascending=False)
            
            for date, amount in dividends.items():
                data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "year": int(date.strftime("%Y")),
                    "amount": float(amount)
                })
        return data
    except Exception as e:
        print(f"Dividend error: {e}")
        return []

@app.get("/api/chart/{symbol}")
def get_chart_data(symbol: str, period: str = "1mo", interval: str = "1d"):
    """Obtiene datos históricos para gráficos"""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)
        
        # Format for Recharts (Frontend)
        chart_data = []
        for date, row in hist.iterrows():
            chart_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": row["Open"],
                "high": row["High"],
                "low": row["Low"],
                "close": row["Close"],
                "volume": row["Volume"]
            })
            
        return chart_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news/{symbol}")
def get_news(symbol: str):
    """Obtiene noticias de la acción desde Finviz y las traduce"""
    try:
        from scraper import get_finviz_news, get_market_sentiment
        print(f"Fetching news for {symbol}...")
        news = get_finviz_news(symbol)
        print(f"Found {len(news)} news items for {symbol}")
        
        # Translate news titles
        translated_news = []
        if not news:
            # DEBUG: Return a placeholder to alert the user/dev
            return [{
                "title": f"No hay noticias recientes para {symbol} (o Finviz bloqueado)",
                "link": "#",
                "time": "Ahora",
                "source": "Sistema BolsaIA"
            }]

        for item in news:
            try:
                # Basic check to avoid translating empty strings
                if item.get('title'):
                    # Translation can be slow, maybe limit to top 3 to speed up?
                    item['title'] = translator.translate(item['title'])
            except Exception as e:
                print(f"Translation error: {e}")
            translated_news.append(item)
            
        return translated_news
    except Exception as e:
        # Fallback to empty list or error
        print(f"News error: {e}")
        return [{
            "title": f"Error cargando noticias: {str(e)}",
            "link": "#",
            "time": "Error",
            "source": "Sistema"
        }]


class SymbolsRequest(BaseModel):
    symbols: List[str]

@app.post("/api/quotes")
def get_batch_quotes(request: SymbolsRequest):
    """Obtiene datos de múltiples acciones a la vez"""
    try:
        symbols = request.symbols
        if not symbols:
            return {}
            
        # yfinance allows fetching multiple tickers space-separated
        tickers_str = " ".join(symbols)
        tickers = yf.Tickers(tickers_str)
        
        results = {}
        for symbol in symbols:
            # Default values
            price = 0
            change_percent = 0
            name = symbol
            asset_type = "Unknown"
            
            # 1. Try to get Price from fast_info (Fast & Reliable)
            try:
                ticker = tickers.tickers[symbol.upper()]
                price = ticker.fast_info.last_price
                prev_close = ticker.fast_info.previous_close
                change_percent = ((price - prev_close) / prev_close) * 100 if prev_close else 0
            except:
                # Fallback to info for price if fast_info fails
                try:
                    info = ticker.info
                    price = info.get("currentPrice") or info.get("regularMarketPrice") or 0
                    change_percent = info.get("regularMarketChangePercent", 0) * 100
                except:
                    pass # Keep 0 if everything fails

            # 2. Try to get Metadata (Name, Type) - Slower / Can Fail
            try:
                # Ensure we have info if not already fetched
                if 'info' not in locals() or not info:
                    info = ticker.info

                # Clean up name
                raw_name = info.get('longName') or info.get('shortName') or symbol
                name = raw_name.replace(" R", "").strip()
                
                quote_type_raw = info.get('quoteType', 'UNKNOWN')
                currency = info.get('currency')
                
                # If currency is missing in info, try fast_info if available
                if not currency:
                    try:
                        currency = ticker.fast_info.currency
                    except:
                        pass
                
                if not currency:
                    currency = "USD" # Default
                
                type_map = {
                    'EQUITY': 'Acción',
                    'ETF': 'ETF',
                    'MUTUALFUND': 'Fondo',
                    'CRYPTOCURRENCY': 'Cripto',
                    'FUTURE': 'Futuro',
                    'INDEX': 'Índice',
                    'CURRENCY': 'Divisa'
                }
                asset_type = type_map.get(quote_type_raw, quote_type_raw)

            except Exception as e:
                # If fetching info fails completely, try to infer minimal data
                print(f"Error fetching metadata for {symbol}: {e}")
                name = symbol
                asset_type = "Unknown"
                
                # Suffix-based currency fallback
                suffix = symbol.split('.')[-1] if '.' in symbol else ""
                if suffix in ['MI', 'PA', 'MC', 'DE', 'AS', 'BR', 'LS', 'VI', 'IR']:
                    currency = "EUR"
                elif suffix == 'L':
                    currency = "GBP"
                elif suffix == 'TO':
                    currency = "CAD"
                else:
                    currency = "USD"

            # 3. Construct Result
            if price != 0:
                results[symbol] = {
                    "price": price,
                    "change": change_percent,
                    "name": name,
                    "type": asset_type,
                    "currency": currency
                }
            else:
                 results[symbol] = {"error": "N/A"}
                    
        return results
    except Exception as e:
        print(f"Batch quote error: {e}")
        return {}

@app.get("/api/price-at-date/{symbol}/{date}")
def get_price_at_date(symbol: str, date: str):
    """
    Obtiene el precio de cierre de una acción en una fecha específica (YYYY-MM-DD).
    """
    try:
        from datetime import datetime, timedelta
        
        target_date = datetime.strptime(date, "%Y-%m-%d")
        start_date = (target_date - timedelta(days=5)).strftime("%Y-%m-%d")
        end_date = (target_date + timedelta(days=1)).strftime("%Y-%m-%d") 
        
        ticker = yf.Ticker(symbol)
        history = ticker.history(start=start_date, end=end_date)
        
        if history.empty:
            return {"error": "No data found for this range"}
        
        filtered = history[history.index.tz_localize(None) <= target_date]
        
        if filtered.empty:
             return {"error": "No trading data found on or before this date"}
             
        row = filtered.iloc[-1] 
        actual_date = filtered.index[-1].strftime("%Y-%m-%d")
        
        return {
            "symbol": symbol.upper(),
            "request_date": date,
            "found_date": actual_date,
            "close": row["Close"]
        }
            
    except Exception as e:
        print(f"History price error: {e}")
        return {"error": str(e)}

@app.get("/api/market-sentiment")
def get_general_market_sentiment():
    """
    Obtiene el sentimiento general del mercado (Fear & Greed index simulado).
    """
    try:
        from scraper import get_market_sentiment
        return get_market_sentiment()
    except Exception as e:
        print(f"Market sentiment error: {e}")
        return {"index": "Neutral", "value": 50, "error": str(e)}

@app.get("/api/sentiment/{symbol}")
def get_sentiment(symbol: str):
    """
    Analiza las noticias recientes usando Google Gemini Pro (si está disponible) o TextBlob.
    Devuelve score, etiqueta, resumen y recomendación.
    """
    try:
        from textblob import TextBlob
        from scraper import get_finviz_news
        
        # Get RAW news (English) from Finviz
        news = get_finviz_news(symbol)
        
        if not news:
            return {"score": 0, "label": "Neutral", "confidence": 0, "summary": "No hay noticias recientes.", "recommendation": "Hold"}

        # 1. Try Gemini API first
        if GEN_API_KEY:
            try:
                model = genai.GenerativeModel('gemini-2.0-flash')
                
                # Prepare prompt with news titles
                headlines = [item['title'] for item in news[:10]] # Limit to recent 10
                news_text = "\n".join(f"- {h}" for h in headlines)
                
                prompt = f"""
                Analiza los siguientes titulares financieros sobre la acción {symbol} y actúa como un experto financiero senior.
                
                Titulares:
                {news_text}
                
                Responde ÚNICAMENTE con un objeto JSON (sin markdown) con este formato:
                {{
                    "score": <float entre -1.0 (Muy Negativo) y 1.0 (Muy Positivo)>,
                    "label": <"Bullish" o "Bearish" o "Neutral">,
                    "confidence": <float entre 0.0 y 1.0>,
                    "summary": <Resumen conciso en Español de lo que pasa en 2 frases>,
                    "recommendation": <"Comprar", "Vender" o "Mantener">
                }}
                """
                
                response = model.generate_content(prompt)
                
                # Clean up response text to ensure it's valid JSON
                cleaned_text = response.text.replace('```json', '').replace('```', '').strip()
                result = json.loads(cleaned_text)
                
                # Validation check
                if "score" in result:
                    # Add news count for UI context
                    result["news_count"] = len(headlines)
                    
                    # Ensure color property exists for UI mapping
                    # Map label to color if not present, though UI logic might handle it
                    if result.get("score") > 0.1:
                        result["color"] = "green"
                    elif result.get("score") < -0.1:
                        result["color"] = "red"
                    else:
                        result["color"] = "gray"
                        
                    # Normalize score to 0-100 logic for gauge if needed, or send raw 
                    # UI expects 0-100? Let's check. 
                    # TextBlob logic was doing normalization.
                    # Let's trust the UI handles 0-100.
                    # Gemini returns -1 to 1.
                    result["score"] = int(((result["score"] + 1) / 2) * 100)
                    
                    return result

            except Exception as e:
                print(f"Gemini Error: {e}")
                # Fallback to TextBlob if Gemini fails
        
        # 2. Fallback to TextBlob (Local NLP)
        print("Using TextBlob Fallback")
        total_polarity = 0
        count = 0
        
        for item in news:
            title = item.get('title', '')
            if title:
                blob = TextBlob(title)
                total_polarity += blob.sentiment.polarity
                count += 1
                
        avg_polarity = total_polarity / count if count > 0 else 0
        
        # Determine label
        if avg_polarity > 0.1:
            label = "Bullish"
            rec = "Comprar"
            color = "green"
        elif avg_polarity < -0.1:
            label = "Bearish"
            rec = "Vender"
            color = "red"
        else:
            label = "Neutral"
            rec = "Mantener"
            color = "gray"

        # Normalize score to 0-100
        normalized_score = int(((avg_polarity + 1) / 2) * 100)
            
        return {
            "symbol": symbol.upper(),
            "score": normalized_score, 
            "label": label, 
            "color": color,
            "confidence": 0.5,
            "summary": "Análisis básico de palabras clave (Modo Offline).",
            "recommendation": rec,
            "news_count": count
        }
            
    except Exception as e:
        print(f"Sentiment Error: {e}")
        return {"score": 0, "label": "Error", "summary": "Error al analizar noticias."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
