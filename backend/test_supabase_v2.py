import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env explicitly
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, ".env")
load_dotenv(env_path)

URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

print(f"URL: {URL}")
print(f"KEY: {KEY[:5]}..." if KEY else "KEY: None")

if not URL or not KEY:
    print("Error: Supabase credentials missing in .env")
    exit(1)

try:
    supabase: Client = create_client(URL, KEY)
    # Try to select from portfolios_v2
    response = supabase.table("portfolios_v2").select("*").limit(1).execute()
    print("Connection successful!")
    print(f"Response data: {response.data}")
except Exception as e:
    print(f"Connection failed: {e}")
