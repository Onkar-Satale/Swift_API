# Centralized configuration setting up logging, environment path resolution, and Groq/GenAI API keys

import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Resolve base directory to locate .env file
env_path = find_dotenv()
if env_path:
    load_dotenv(dotenv_path=env_path, override=True)

# Retrieve API keys and configuration from environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GENAI_API_SECRET = os.getenv("GENAI_API_SECRET", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

if not GROQ_API_KEY:
    raise Exception("GROQ_API_KEY is missing. Please set it in the .env file.")

class Settings:
    GROQ_API_KEY: str = GROQ_API_KEY
    GENAI_API_SECRET: str = GENAI_API_SECRET
    GROQ_MODEL: str = GROQ_MODEL

settings = Settings()