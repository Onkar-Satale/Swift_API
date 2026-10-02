"""
FastAPI Application Initialization
Configures logging, rate limiting (SlowAPI), dependency injection authentication (x-api-key),
and registers analysis/chatbot API routers.
"""

import logging
from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config.settings import settings
from app.routes.analyze import router as analyze_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Global rate limiter keying by remote client IP address
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(title="SwiftAPI GenAI Service with Groq", docs_url=None, redoc_url=None, openapi_url=None)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request):
    """Health check endpoint for deployment monitoring."""
    return {"message": "GenAI service running securely."}

app.include_router(analyze_router)