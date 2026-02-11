import os
from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict
from groq import Groq  # Groq SDK for calling Groq LLM
from fastapi.middleware.cors import CORSMiddleware


# ---------------- ENV ----------------
env_path = find_dotenv()
load_dotenv(dotenv_path=env_path, override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise Exception("GROQ_API_KEY not set in environment variables!")

# ---------------- FASTAPI ----------------
app = FastAPI(title="Postman Clone GenAI Service with Groq")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Pydantic Models ----------------
class AnalyzeRequest(BaseModel): 
    method: str
    url: str
    headers: Dict[str, Any] = {}
    body: Any = None
    status: int
    response: Any
    feature: str = "root_cause"  # ADD THIS

    

# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"message": "GenAI service running with Groq API"}




# ---------------- SMART ERROR TRANSLATOR ----------------
def smart_error_translator(req: AnalyzeRequest):
    """
    Calls Groq LLM to translate API error responses into
    simple, friendly English.
    """
    error_content = req.response or "No response body provided."

    # Build a prompt for the LLM
    prompt = f"""
You are an expert API assistant. 

Translate the following API response/error into very simple English
so that a junior developer or beginner can understand it.
Explain the cause of the error and what they can do to fix it.
Keep it friendly, clear, and emoji-rich.

API Response:
{error_content}
"""

    try:
        client = Groq(api_key=GROQ_API_KEY)
        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a friendly, emoji-rich API assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_completion_tokens=400
        )

        explanation = res.choices[0].message.content

        return {
            "type": "smart_error_translator",
            "text": explanation
        }

    except Exception as e:
        return {
            "type": "smart_error_translator",
            "text": f"❌ Failed to translate error: {str(e)}"
        }


# ---------------- ANALYZE ENDPOINT ----------------
@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """
    Calls Groq LLM and returns structured JSON matching Postman clone frontend.
    """

    # ---------------- SMART ERROR TRANSLATOR ----------------
    if req.feature == "smart_error_translator":
        # Returns {"type": "smart_error_translator", "text": "..."}
        return smart_error_translator(req)

    # ---------------- OTHER LLM ANALYSIS ----------------
    prompt = f"""
You are J.A.R.V.I.S. 🤖✨ — a smart, friendly API assistant.

Your response must be:
- Plain English (easy to read)
- Light technical wording (status codes, headers, payloads)
- Emoji-rich 😄📡🧪
- Cleanly formatted
- NOT JSON
- NOT markdown code blocks
- NOT raw objects

FORMAT RULES (VERY IMPORTANT):
- Each section MUST be separated by ONE empty line
- Section titles MUST be on their own line
- Use simple visual emphasis like emojis, not markdown
- Use bullet points with "•" (NOT *, NOT -)
- Do NOT repeat section titles
- If a section has no content, SKIP IT

STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:

🧠 Diagnosis
(explain what happened in 2–3 friendly lines)

[EMPTY LINE]

📌 Summary
(short, clear conclusion — was it successful or not)

[EMPTY LINE]

🚀 Suggestions
• bullet point
• bullet point
• bullet point

[EMPTY LINE]

Now analyze this API call:

Request:
Method: {req.method}
URL: {req.url}
Headers: {req.headers}
Body: {req.body}

Response:
Status Code: {req.status}
Response Body: {req.response}
"""

    try:
        client = Groq(api_key=GROQ_API_KEY)
        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a friendly, emoji-rich API assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_completion_tokens=700
        )
        ai_text_raw = res.choices[0].message.content

        # Return top-level "text" key for frontend
        return {
            "type": "root_cause_analysis",
            "text": ai_text_raw
        }

    except Exception as e:
        return {
            "type": "root_cause_analysis",
            "text": f"❌ Error calling Groq API: {str(e)}"
        }
