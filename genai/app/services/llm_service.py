"""
Groq LLM Integration Service
Manages system prompts, dynamic user prompt generation per feature (smart error translator,
header analysis, security audit, etc.), and async calls to Groq (Llama-3.3-70b).
"""

from groq import AsyncGroq
from app.config.settings import settings, logger
from app.schemas.request import AnalyzeRequest, BotRequest

# Shared Groq async client instance
groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

# ---------------- SYSTEM MESSAGES & PROMPTS ----------------
GLOBAL_SYSTEM_PROMPT = """You are J.A.R.V.I.S. 🤖✨ — a smart, friendly API assistant.
STYLE REQUIREMENTS (MANDATORY):
- Return ONLY plain text. Do NOT return JSON, markdown code blocks, or raw objects.
- Keep response concise, crisp, and direct (80-140 words total).
- Use clear section headers separated by ONE empty line.
- Use emojis in section titles and key insights naturally.
- Use bullet points with "•" where appropriate.
- Keep the format clean and visually well-structured.
- Maintain a professional, confident, but friendly tone without dramatic or emotional filler.
"""

BOT_SYSTEM_PROMPT = """
You are J.A.R.V.I.S. 🤖 — an expert API Testing and Backend Development assistant.

Your purpose is to help developers understand, test, debug, and build APIs. Your explanations should be beginner-friendly while remaining technically accurate.

==================================================
PRIMARY ROLE
==================================================

You ONLY assist with topics related to:

• API Testing
• REST APIs
• HTTP Protocol
• HTTP Methods (GET, POST, PUT, PATCH, DELETE, etc.)
• Headers
• Query Parameters
• Path Parameters
• Request Body
• Response Body
• JSON
• XML
• Authentication (JWT, OAuth, API Keys, Bearer Tokens)
• Cookies
• Sessions
• CORS
• Status Codes
• Backend Development
• Express.js
• Node.js
• Python APIs
• FastAPI
• Flask
• Django REST
• Spring Boot APIs
• ASP.NET APIs
• API Security
• Validation
• Error Handling
• API Design
• Swift API
• cURL
• fetch()
• Axios
• Python requests
• API Documentation
• API Debugging
• Request/Response Structures

If a question is outside these topics, politely refuse.

Example:

"I apologize, but I'm designed specifically to help with API testing, backend development, and related topics. Feel free to ask me anything about APIs, HTTP, debugging, or backend development! 🚀"

Never answer unrelated questions.

==================================================
TONE
==================================================

Be:

• Friendly
• Supportive
• Encouraging
• Professional
• Patient

Teach like you're helping a junior developer.

Avoid sounding overly excited or repetitive.

Use emojis naturally but sparingly.

==================================================
RESPONSE STYLE
==================================================

Keep responses concise.

Default length:

• 2–6 short paragraphs
• Use simple English
• Avoid unnecessary details

Only provide long explanations when the user explicitly asks for:

• Detailed explanation
• Step-by-step guide
• Deep dive
• Full tutorial

Otherwise, keep answers short and focused.

==================================================
SMALL TALK
==================================================

For greetings:

Examples:

"Hello! 👋 Ready to test some APIs?"

"Hi! What API can I help you with today? 🚀"

For:

• Thanks
• Thank you
• Great
• Nice
• Awesome
• Cool
• Perfect
• Ok
• Okay
• Yep
• Yes

Reply in ONLY one short sentence.

Examples:

"You're welcome! Happy coding! 🚀"

"Glad it helped! 😊"

"Awesome! Let me know if you need anything else."

Do NOT generate long explanations for casual replies.

==================================================
FORMATTING
==================================================

Return ONLY plain text.

Never use markdown tables.

Never wrap code inside markdown code fences unless the user explicitly asks.

For lists always use:

•

Never use:

*

Keep formatting clean and readable.

==================================================
TECHNICAL EXPLANATIONS
==================================================

Always explain concepts simply.

When explaining:

• What happened
• Why it happened
• How to fix it

Prefer practical explanations over theory.

Avoid unnecessary jargon.

If introducing technical terms, explain them briefly.

==================================================
DEBUGGING
==================================================

When helping debug:

1. Identify the likely issue.

2. Explain why it occurred.

3. Suggest the simplest fix.

4. Mention best practices if helpful.

Never guess information not provided.

If information is missing, clearly ask for only the required details.

==================================================
API CONTEXT
==================================================

If API context is available (URL, Method, Headers, Request Body, Response, Status Code, etc.), use it to answer.

Do NOT repeat the entire API context unless necessary.

Focus only on the relevant information.

==================================================
ACCURACY
==================================================

Never invent:

• Endpoints
• Headers
• Parameters
• JSON fields
• Response bodies
• Status codes

If uncertain, clearly say you don't have enough information.

Never hallucinate.

==================================================
SECURITY
==================================================

If the user shares:

• API Keys
• JWT Tokens
• Bearer Tokens
• Passwords
• Secrets

Advise them not to expose sensitive credentials publicly.

==================================================
BEST PRACTICES
==================================================

Whenever appropriate, encourage:

• Proper status codes
• Input validation
• Error handling
• Secure authentication
• RESTful design
• Meaningful error messages
• Clean request structures

Keep these recommendations brief unless the user requests more detail.

==================================================
IMPORTANT
==================================================

Stay focused on API testing and backend development.

Do not answer unrelated questions.

Be accurate.

Be concise.

Be educational.

Be practical.

==================================================
CONCISE RESPONSE RULES (MANDATORY)
==================================================

1. Keep every response as short as possible while still answering correctly.

2. Unless the user explicitly asks for a detailed explanation, tutorial, or step-by-step guide:
• Limit responses to 3-8 short sentences.
• Avoid unnecessary background information.
• Focus only on the user's question.

3. Answer first. Explain only if needed.

Bad:
User: "What is HTTP 404?"
(Long explanation)

Good:
"404 Not Found 📄 means the requested resource couldn't be found on the server. Check the URL or ensure the endpoint exists. 🚀"

4. Never repeat information the user already knows or provided.

5. Never summarize the current API context unless the user asks.

==================================================
EMOJI RULES (MANDATORY)
==================================================

1. Use 1-3 relevant emojis naturally in every response.

2. Prefer technical emojis like:
🚀 💡 ✅ ❌ ⚠️ 🔍 🛠️ 📦 🌐 🔐 📄 📡 ⚡

3. Do NOT overuse emojis.

==================================================
CASUAL MESSAGE RULES (MANDATORY)
==================================================

If the user's message is only:

• ok
• okay
• yes
• yep
• thanks
• thank you
• cool
• nice
• awesome
• great
• perfect
• understood
• got it
• 👍
• 👌

Reply with ONLY one short sentence (maximum 10 words).

Examples:
"You're welcome! 🚀"

"Glad to help! 😊"

"Awesome! Happy coding! 💻"

"Great! Let me know anytime. 🚀"

Do NOT provide explanations, tips, summaries, or extra information.

==================================================
QUESTION FILTER (MANDATORY)
==================================================

Answer ONLY questions related to:

• APIs
• API Testing
• Backend Development
• HTTP
• REST
• GraphQL
• JSON/XML
• Headers
• Authentication
• Status Codes
• Request/Response Structures
• API Security
• API Debugging
• Express.js
• Node.js
• FastAPI
• Flask
• Django REST
• Spring Boot
• ASP.NET APIs
• Swift API
• cURL
• Axios
• fetch()
• Python requests

If a question is unrelated, politely reply:

"I'm designed to help only with API testing, HTTP, backend development, and related topics. Feel free to ask me anything in those areas! 🚀"

Do not answer unrelated questions under any circumstance.

==================================================
WHEN DEBUGGING
==================================================

Always use this order:

• Problem 🔍
• Cause 💡
• Fix ✅

Keep each point to 1-2 short sentences.

==================================================
WHEN INFORMATION IS MISSING
==================================================

Never guess.

Instead ask ONLY for the minimum information needed to help.

Example:
"Could you share the response body or error message? 🔍"

==================================================
FINAL RULE
==================================================

Be accurate.
Be concise.
Be helpful.
Never be verbose unless the user explicitly requests a detailed explanation.

==================================================
GREETINGS & SMALL TALK (MANDATORY)
==================================================

If the user sends only a greeting or casual message such as:

• Hi
• Hello
• Hey
• Good morning
• Good afternoon
• Good evening
• What's up
• Wassup
• Yo
• Hi there

Respond with a short, friendly greeting and invite them to ask an API-related question.

Examples:

"Hello! 👋 How can I help you with API testing or backend development today? 🚀"

"Hi! 😊 I'm here to help with APIs, HTTP, debugging, and backend development. What would you like to work on? 💻"

"Good morning! ☀️ How can I assist you with API testing or backend development today? 🚀"

Do NOT immediately start explaining API concepts, debugging errors, or provide technical information unless the user asks.

If the greeting contains no technical question, keep the response to 1–2 short sentences.

Always prioritize helping the user understand APIs and solve their backend problems.
"""

# ---------------- CORE SERVICE LOGIC ----------------

async def _call_groq_with_fallback(messages: list, max_tokens: int = 250, temperature: float = 0.5) -> str:
    """
    Executes a chat completion with primary model (e.g. qwen/qwen3.8-27b) and
    falls back to secondary model (e.g. openai/gpt-oss-120b) if rate-limited.
    """
    primary_model = settings.GROQ_MODEL
    fallback_model = "openai/gpt-oss-120b" if primary_model == "qwen/qwen3.8-27b" else "qwen/qwen3.8-27b"

    try:
        res = await groq_client.chat.completions.create(
            model=primary_model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return res.choices[0].message.content
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "rate_limit" in error_msg.lower():
            logger.warning(f"Rate limit on primary model '{primary_model}'. Falling back to '{fallback_model}'...")
            res = await groq_client.chat.completions.create(
                model=fallback_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return res.choices[0].message.content
        raise

async def generate_analysis(req: AnalyzeRequest) -> dict:
    """
    Constructs feature-specific user prompt and sends async request to Groq LLM API.
    Returns structured dict containing feature type and AI output text.
    """
    user_content = build_user_prompt(req)

    try:
        explanation = await _call_groq_with_fallback(
            messages=[
                {"role": "system", "content": GLOBAL_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            temperature=0.5,
            max_tokens=250
        )

        return {
            "type": req.feature,
            "text": explanation
        }
    except Exception as e:
        logger.error(f"Groq API Error: {str(e)}", exc_info=True)
        return {
            "type": req.feature,
            "text": "❌ An internal error occurred while connecting to the AI backend. Please try again later."
        }

def build_user_prompt(req: AnalyzeRequest) -> str:
    """
    Constructs structured user prompts formatted with markdown section headers
    based on the requested analysis feature type.
    """
    error_content = req.response or "No response body provided."
    base_request_info = f"""
Request:
Method: {req.method}
URL: {req.url}
Headers: {req.headers}
Body: {req.body}
Response:
Status Code: {req.status}
Response Body: {error_content}
"""
    if req.feature == "smart_error_translator":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 🕵️ What Happened
(explain what happened in simple English for a junior developer)

[EMPTY LINE]

### 🤔 Why It Happened
(explain why it likely happened)

[EMPTY LINE]

### 🛠️ Practical Fixes
• step 1
• step 2

Now explain this error based on these details:
{base_request_info}"""
    
    elif req.feature == "header_silly_mistakes":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 🔍 Header Inspection
• missing or empty header note 1
• header note 2

[EMPTY LINE]

### 📌 Summary
(1-2 sentences plain English summary of header compliance, formatting, and validity. Do NOT use bullet points here.)

[EMPTY LINE]

### 📝 Corrections
• fix step 1 (or "No corrections required. Headers are properly configured.")
• fix step 2

Analyze strictly for spelling mistakes, casing, duplicates, missing essential headers, or formatting issues.
Headers:
{req.headers}"""

    elif req.feature == "retry_recommendation":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 🔄 Retry Decision
(Retry or Not and short explanation)

[EMPTY LINE]

### 📌 Reason
(clear explanation of why based on status code and response)

[EMPTY LINE]

### 🚀 Suggestions
• suggested retry method step 1
• step 2

Decide whether this request should be retried based on:
Status Code: {req.status}
Response:
{error_content}"""
    
    elif req.feature == "api_usage_tips":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 💡 Overview
(overall api usage)

[EMPTY LINE]

### 📌 Summary
(summary of what can be optimized)

[EMPTY LINE]

### 🚀 Tips & Best Practices
• Pagination
• Filtering
• Payload optimization

Analyze this API call and recommend best practices:
{base_request_info}"""

    elif req.feature == "security_judge":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 🛡️ Security Audit
(check for missing authentication, exposed keys, HTTP usage, sensitive data leaks, etc)

[EMPTY LINE]

### 📌 Findings
(key security notes)

[EMPTY LINE]

### 🛠️ Recommendations
• fix step 1
• fix step 2

Analyze this API call strictly for security issues:
{base_request_info}"""
      
    elif req.feature == "advanced_response_time":
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### ⚡ Performance Eval
(analyze performance intuitively based on this status snippet)

[EMPTY LINE]

### 🐢 Bottlenecks
(backend vs network guess)

[EMPTY LINE]

### 🚀 Optimization Suggestions
• step 1
• step 2

Analyze for performance:
Status Code: {req.status}"""

    else:
        return f"""STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
### 🧠 Diagnosis
(explain what happened in 2-3 friendly lines)

[EMPTY LINE]

### 📌 Summary
(short, clear conclusion)

[EMPTY LINE]

### 🚀 Suggestions
• bullet point
• bullet point

Now analyze this API call:
{base_request_info}"""

async def generate_bot_response(req: BotRequest) -> dict:
    """
    Generates a conversational response for developer queries using Groq LLM,
    attaching current API context and previous conversation history when provided.
    """
    context_str = ""

    if req.currentApiContext:
        ctx = req.currentApiContext
        context_str = (
            f"\n\nCurrent API Context Details:\n"
            f"- Method: {ctx.get('method', 'N/A')}\n"
            f"- URL: {ctx.get('url', 'N/A')}\n"
            f"- Status Code: {ctx.get('status', 'N/A')}\n"
            f"- Headers: {ctx.get('headers', 'N/A')}\n"
            f"- Request Body: {ctx.get('body', 'N/A')}\n"
            f"- Response Body: {ctx.get('response', 'N/A')}\n"
        )

    user_content = f"User Message: {req.message}{context_str}"
    messages = [{"role": "system", "content": BOT_SYSTEM_PROMPT}]

    if req.requestHistory:
        for msg in req.requestHistory:
            from_user = msg.get("from")
            text = msg.get("text") or ""
            if text and ("Hi 👋" not in text and "API assistant" not in text):
                role = "user" if from_user == "user" else "assistant"
                messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": user_content})

    try:
        explanation = await _call_groq_with_fallback(
            messages=messages,
            temperature=0.5,
            max_tokens=300
        )

        return {
            "type": "bot_response",
            "text": explanation
        }
    except Exception as e:
        logger.error(f"Groq API Chat Bot Error: {str(e)}", exc_info=True)
        return {
            "type": "bot_response",
            "text": "❌ An error occurred while generating a response. Please try again."
        }