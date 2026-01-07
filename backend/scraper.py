import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def get_finviz_news(symbol):
    """Scrapes news headlines from Finviz for a specific symbol"""
    url = f"https://finviz.com/quote.ashx?t={symbol}&p=d"
    try:
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.content, "html.parser")
        news_table = soup.find(id="news-table")
        
        news_items = []
        if news_table:
            for row in news_table.findAll("tr"):
                link = row.a
                timestamp = row.td.text.strip()
                if link:
                    news_items.append({
                        "title": link.text,
                        "link": link['href'],
                        "time": timestamp
                    })
        return news_items[:10]  # Return top 10 news
    except Exception as e:
        print(f"Error scraping Finviz: {e}")
        return []

import yfinance as yf
import requests
from bs4 import BeautifulSoup
import re

def get_market_sentiment():
    """
    Fetches real market sentiment from CNN Fear & Greed API and AAII.
    Falls back to VIX/Momentum if CNN fails.
    """
    sentiment_data = {
        "index": "Neutral",
        "value": 50,
        "color": "gray",
        "summary": "Analizando...",
        "vix": 0,
        "sources": []
    }

    # 1. CNN Fear & Greed (Official API)
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Referer": "https://edition.cnn.com/",
            "Origin": "https://edition.cnn.com"
        }
        url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
        r = requests.get(url, headers=headers, timeout=5)
        
        if r.status_code == 200:
            data = r.json()
            fng = data['fear_and_greed']
            score = int(fng['score'])
            # Translate Label to Spanish
            label_map = {
                "Extreme Fear": "Miedo Extremo",
                "Fear": "Miedo",
                "Neutral": "Neutral",
                "Greed": "Codicia",
                "Extreme Greed": "Codicia Extrema"
            }
            spanish_index = label_map.get(data['fear_and_greed']['rating'].title(), data['fear_and_greed']['rating'])
            
            sentiment_data.update({
                "value": score,
                "index": spanish_index,
                "summary": f"Índice de Miedo y Codicia: {score} ({spanish_index})",
                "timestamp": fng['timestamp']
            })
            
            # Map Color
            if score < 25: sentiment_data["color"] = "red"
            elif score < 45: sentiment_data["color"] = "orange"
            elif score < 55: sentiment_data["color"] = "gray"
            elif score < 75: sentiment_data["color"] = "blue"
            else: sentiment_data["color"] = "green"
            
            sentiment_data["sources"].append("CNN Money")
            
    except Exception as e:
        print(f"CNN Scraping Error: {e}")
        # FALLBACK for sentiment score if CNN fails
        try:
             vix = yf.Ticker("^VIX").fast_info.last_price
             sentiment_data["vix"] = round(vix, 2)
             if vix > 30: sentiment_data.update({"value": 20, "index": "Fear", "color": "red"})
             elif vix < 15: sentiment_data.update({"value": 80, "index": "Greed", "color": "green"})
             sentiment_data["summary"] = "Estimado vía VIX (CNN no disponible)"
        except:
             pass

    # ALWAYS fetch VIX for display (Yahoo Finance)
    try:
         vix_ticker = yf.Ticker("^VIX")
         vix = vix_ticker.fast_info.last_price
         
         # If fast_info fails or returns 0 (market closed/delayed), try history
         if not vix:
             hist = vix_ticker.history(period="1d")
             if not hist.empty:
                 vix = hist['Close'].iloc[-1]

         if vix:
            sentiment_data["vix"] = round(vix, 2)
            print(f"DEBUG: VIX updated via Yahoo Finance: {sentiment_data['vix']}")
         else:
            print("DEBUG: VIX fetch returned None/0")
            
    except Exception as e:
        print(f"VIX Fetch Error: {e}")

    # 2. AAII Sentiment (Best Effort)
    try:
        aaii_url = "https://www.aaii.com/sentimentsurvey"
        headers_aaii = {"User-Agent": "Mozilla/5.0"}
        r_aaii = requests.get(aaii_url, headers=headers_aaii, timeout=5)
        
        if r_aaii.status_code == 200:
            soup = BeautifulSoup(r_aaii.content, "html.parser")
            text = soup.get_text()
            
            # Look for patterns like "Bullish 42.0%" or similar structure
            # This is fragile, but we try standard keywords
            
            # Placeholder for AAII data structure
            aaii_data = {}
            
            # Try to find percentages associated with Sentiment
            # Note: The browser saw "Bullish: 42.0%", let's look for that
            bullish_match = re.search(r"Bullish.*?(\d+\.?\d*)%", text, re.IGNORECASE)
            bearish_match = re.search(r"Bearish.*?(\d+\.?\d*)%", text, re.IGNORECASE)
            
            if bullish_match:
                aaii_data["bullish"] = float(bullish_match.group(1))
            if bearish_match:
                aaii_data["bearish"] = float(bearish_match.group(1))
                
            if aaii_data:
                sentiment_data["aaii"] = aaii_data
                sentiment_data["sources"].append("AAII")
                
    except Exception as e:
        print(f"AAII Scraping Error: {e}")

    return sentiment_data
