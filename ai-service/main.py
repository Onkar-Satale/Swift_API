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

# ---------------- SHORT RESPONSE RULE ----------------
# ---------------- SHORT RESPONSE RULE ----------------
# ---------------- SHORT RESPONSE RULE ----------------
SHORT_RULE = """
IMPORTANT RESPONSE GUIDELINES:

- Keep total response between 180–250 words
- Provide moderate detail (not too brief, not too long)
- Use 4–6 bullet points if helpful
- Each explanation can be 2–3 lines if needed
- Be clear and structured
- Focus on practical insights and reasoning
- Avoid unnecessary repetition
- Avoid dramatic or emotional filler
- Maintain a professional but friendly tone
- Ensure the response feels complete, not compressed
"""


# ---------------- ERROR TRANSLATOR RULE ----------------
ERROR_RULE = """
IMPORTANT RESPONSE RULES:

- Keep response under 250 words
- Explain the error in simple, non-scary language
- Clearly state what caused it
- Give 4–5 practical fix steps
- Avoid technical overload
- Avoid dramatic or alarming wording
- Be calm, reassuring, and supportive
- Do not repeat the raw error message fully
- Keep format clean and easy to read
"""

GLOBAL_STYLE_RULE = """
STYLE REQUIREMENTS (MANDATORY):

- Use emojis in section titles and key insights
- Add relevant emojis naturally (not spammy)
- Use clear section headers
- Separate sections with ONE empty line
- Use bullet points with "•"
- Make response visually structured and attractive
- Avoid large text blocks
- Keep formatting consistent
- Do NOT return JSON
"""




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
You are a calm and supportive API assistant.

{ERROR_RULE}

Translate the following API response/error into very simple English
so that a junior developer can understand it easily.

Explain:
- What happened
- Why it likely happened
- What they can do to fix it

Keep the tone reassuring and confident.
Do NOT make the error sound scary.

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
    elif req.feature == "header_silly_mistakes":
        prompt = f"""
You are an API Header Inspector.

Rules:
- If headers are empty, clearly say: "No headers were provided."
- If headers are present and no issues are found, say: "No header issues detected."
- If issues exist, list them clearly using bullet points.

Only detect:
• Header spelling mistakes
• Wrong capitalization
• Duplicate headers
• Invalid header format

Do NOT analyze response.
Do NOT give general API advice.

Headers:
{req.headers}
"""

    elif req.feature == "retry_recommendation":
        prompt = f"""
You are a retry strategy expert.

{SHORT_RULE}

Based only on status code and response,
decide whether this request should be retried.

Return:
• Retry or Not
• Reason
• Suggested retry method (if needed)

Status Code: {req.status}
Response:
{req.response}
"""

    elif req.feature == "api_usage_tips":
        
        prompt = f"""
You are an API usage optimizer.

{SHORT_RULE}
{GLOBAL_STYLE_RULE}

Give only improvement tips.

Focus on:
• Pagination
• Filtering
• Payload optimization
• Best practices

Request:
Method: {req.method}
URL: {req.url}
Headers: {req.headers}
Body: {req.body}
"""

    elif req.feature == "security_judge":
        prompt = f"""
You are a strict API security auditor.

{SHORT_RULE}
{GLOBAL_STYLE_RULE}

Check for:
• Missing authentication
• Exposed API keys
• HTTP instead of HTTPS
• Sensitive data leaks
• Insecure headers

Return only security findings.

Request:
URL: {req.url}
Headers: {req.headers}
Body: {req.body}
Response:
{req.response}
"""

    elif req.feature == "advanced_response_time":
        prompt = f"""
You are an API performance analyst.

{SHORT_RULE}
{GLOBAL_STYLE_RULE}

Analyze performance and response time deeply.

Return:
• Performance evaluation
• Possible bottlenecks
• Backend vs Network guess
• Optimization suggestions

Status Code: {req.status}
"""

    # ---------------- OTHER LLM ANALYSIS ----------------
    else:
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
            max_completion_tokens=400
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
