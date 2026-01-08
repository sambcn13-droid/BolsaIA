import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

try:
    supabase: Client = create_client(URL, KEY)
    
    tables_to_check = ["portfolios_v2", "portfolios", "user_portfolios"]
    for table in tables_to_check:
        try:
            response = supabase.table(table).select("*").limit(1).execute()
            print(f"Table '{table}' exists!")
        except Exception as e:
            if "PGRST205" in str(e):
                print(f"Table '{table}' does NOT exist.")
            else:
                print(f"Error checking '{table}': {e}")
except Exception as e:
    print(f"Failed to connect: {e}")
