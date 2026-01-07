
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import get_quote

def test_currency():
    symbol = "QQQ3.MI"
    print(f"Testing currency for {symbol}...")
    try:
        data = get_quote(symbol)
        print(f"Symbol: {data['symbol']}")
        print(f"Currency: {data['currency']}")
        
        if data['currency'] == 'EUR':
            print("SUCCESS: Currency is EUR")
        else:
            print(f"FAILURE: Currency is {data['currency']}, expected EUR")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_currency()
