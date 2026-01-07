import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai

print("--- DIAGNOSTICO DE BOLSA-IA ---")
print(f"Directorio de ejecucion: {os.getcwd()}")
print(f"Ubicacion del script: {os.path.abspath(__file__)}")

# 1. Try loading .env explicitly
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, ".env")
print(f"Buscando .env en: {env_path}")

if os.path.exists(env_path):
    print("Archivo .env ENCONTRADO.")
    load_dotenv(env_path)
else:
    print("ERROR: Archivo .env NO ENCONTRADO.")

# 2. Check Key
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    print(f"API Key detectada: {api_key[:5]}...{api_key[-4:]}")
else:
    print("ERROR: Variable GEMINI_API_KEY no encontrada o vacia.")
    sys.exit(1)

# 3. Test Gemini Connection
print("\nProbando conexion con Google Gemini...")
try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Responde 'OK' si recibes este mensaje.")
    print(f"Respuesta de Gemini: {response.text}")
    print(">>> CONEXION EXITOSA <<<")
except Exception as e:
    print(f"ERROR DE CONEXION: {e}")
    print("Detalles del error (tipo):", type(e))

print("-------------------------------")
