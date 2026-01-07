
import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

def test_persistence():
    print(f"Testing persistence against {BASE_URL}...")

    # 1. Initial Get
    try:
        r = requests.get(f"{BASE_URL}/portfolios")
        print(f"GET /portfolios status: {r.status_code}")
        initial_data = r.json()
        print(f"Initial data: {initial_data}")
    except Exception as e:
        print(f"Failed to connect to backend: {e}")
        return

    # 2. Save Data
    test_data = [
        {
            "id": "test-1",
            "name": "Test Portfolio",
            "color": "blue",
            "holdings": []
        }
    ]
    
    print("Attempting to SAVE data...")
    try:
        # Client.js sends { portfolios: [...] }
        payload = {"portfolios": test_data}
        r = requests.post(f"{BASE_URL}/portfolios", json=payload)
        print(f"POST /portfolios status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Failed to POST data: {e}")
        return

    # 3. Verify Persistence
    print("Verifying persistence with new GET...")
    try:
        r = requests.get(f"{BASE_URL}/portfolios")
        new_data = r.json()
        print(f"New data: {new_data}")
        
        if len(new_data) == 1 and new_data[0]['id'] == 'test-1':
            print("SUCCESS: Data persisted correctly.")
        else:
            print("FAILURE: Data returned does not match saved data.")
    except Exception as e:
        print(f"Failed to verify data: {e}")

if __name__ == "__main__":
    test_persistence()
