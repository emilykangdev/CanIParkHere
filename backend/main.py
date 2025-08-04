from geo.spatial_query import get_parking_category, get_rpz_zone, get_signs_nearby
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import base64
import os
from openai import OpenAI
import json
import uuid
import re

from message_types import (
    ParkingCheckResponse, 
    LocationCheckResponse,
    LocationCheckRequest,
    FollowUpRequest, 
    FollowUpResponse
)
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="CanIParkHere API", version="1.0.0")
store = {}

# Initialize OpenAI client (conditional for API generation)
client = None
try:
    if os.getenv("OPENAI_API_KEY"):
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    print(f"Warning: OpenAI client initialization failed: {e}")
    print("Server will start but image processing will be disabled")

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "https://caniparkhere.dev",
        "https://caniparkhere.vercel.app"  # Default Vercel domain as backup
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    print(f"Origin: {request.headers.get('origin', 'No origin header')}")
    print(f"User-Agent: {request.headers.get('user-agent', 'No user-agent')}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

image_prompt = """
You are a helpful assistant that interprets parking signs from images.
Given a photo of a parking sign, output the result in **valid JSON only** with the following keys:

{{
  "isParkingSignFound": "true" | "false",
  "canPark": "true" | "false" | "uncertain",
  "reason": "Clear one-sentence explanation",
  "rules": "Full text of the parsed parking rule(s)",
  "parsedText": "The raw text you extracted from the sign",
  "advice": "Optional human-friendly tip or clarification"
}}

The current date/time is in '%a %I:%M%p' format: {datetime_str}
Use the the current date/time to determine if parking is allowed and reference it in your response.
Respond with *JSON only*, no extra text. If there is no parking sign found, say parkingSignFound = false in the JSON.
You must respond with valid JSON only — do NOT use markdown, backticks, or explanations.
"""

followup_prompt_template = """
    You are a parking assistant.

    Here is the previously parsed parking sign data:
    {previous_summary}

    Use the current time for your response in '%a %I:%M%p' format: {datetime_str}

    User's follow-up question:
    \"{question}\"

    Answer based only on the parking sign data above. If the question is unrelated, say "I can only answer parking sign questions." Be concise.
"""

# Message types are now imported from message_types.py

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "CanIParkHere API is running!"}



# @app.post("/check-parking-text", response_model=ParkingCheckResponse)
# async def check_parking_from_text(request: ParkingCheckRequest):
#     """
#     Check parking availability from manual text input.
    
#     Args:
#         request: Contains sign_text and datetime_str
        
#     Returns:
#         Parking check result with details
#     """
#     try:
#         result = 
        
#         return ParkingCheckResponse(
#             result=result,
#             sign_text_used=request.sign_text,
#             parsed_rules=parsed_rules,
#             processing_method="manual_text_input"
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


async def get_summary_from_image_with_gpt4o(image_bytes: bytes) -> str:
    """
    Extract parking sign text using GPT-4o-mini vision capabilities.
    """
    print("=== ENTERING get_summary_from_image_with_gpt4o ===")
    print(f"Client available: {client is not None}")
    print(f"Image bytes length: {len(image_bytes)}")
    
    if not client:
        print("ERROR: OpenAI client not available")
        raise HTTPException(status_code=503, detail="OpenAI client not available")
        
    try:
        print("Starting base64 encoding...")
        # Encode image to base64
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        print(f"Base64 encoding complete, length: {len(base64_image)}")
        
        print("Creating datetime string...")
        datetime_str = datetime.now().strftime("%a %I:%M%p")  # Current datetime in required format
        print(f"Datetime: {datetime_str}")
        
        print("Making OpenAI API call...")
        print(f"About to format image_prompt with datetime: {datetime_str}")
        
        try:
            formatted_prompt = image_prompt.format(datetime_str=datetime_str)
            print("Prompt formatting successful")
        except Exception as format_error:
            print(f"Prompt formatting failed: {format_error}")
            raise
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages = [
                {
                    "role": "system",
                    "content": formatted_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )
        print("OpenAI API call successful!")
        print(f"Response object type: {type(response)}")
        print(f"Response choices length: {len(response.choices)}")
        print(f"First choice: {response.choices[0]}")
        
        content = response.choices[0].message.content.strip()
        print(f"GPT-4o raw response: {content}")
        print(f"Content type: {type(content)}")
        return content
        
    except Exception as e:
        print(f"Exception in get_summary_from_image_with_gpt4o: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image with GPT-4o: {str(e)}")


def extract_json_from_gpt_output(response: str) -> dict:
    # Extract JSON code block if wrapped in triple backticks
    json_block = re.search(r"```(?:json)?\s*({.*?})\s*```", response, re.DOTALL)
    if json_block:
        json_str = json_block.group(1)
    else:
        # Fallback: assume entire string is JSON
        json_str = response.strip()

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON decode error: {str(e)} | Raw: {json_str[:300]}")
    
@app.post("/check-parking-image", response_model=ParkingCheckResponse)
async def check_parking_from_image(
    file: UploadFile = File(...),
    datetime_str: str = Form(...),
) -> ParkingCheckResponse:
    """
    Query ChatGPT, get a JSON response, and return a structured ParkingCheckResponse about the parking image.
    FastAPI automatically converts the returned object into JSON.
    This also saves the JSON into an in-memory dictionary.
    """
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    try:
        image_bytes = await file.read()
        print("Right before GPT-4o call, image size:", len(image_bytes))
        summary_str = await get_summary_from_image_with_gpt4o(image_bytes)
        summary_json = extract_json_from_gpt_output(summary_str)
        session_id = str(uuid.uuid4())
        # In-memory: This maps a Session ID to the summary JSON for later follow-up questions.
        store[session_id] = summary_json
        # Check if the sign was found and set message type
        is_sign_found = summary_json.get("isParkingSignFound", "true") == "true"
        message_type = "parking" if is_sign_found else "error"

        return ParkingCheckResponse(
            messageType=message_type, 
            session_id=session_id,
            isParkingSignFound="true" if is_sign_found else "false",
            canPark=summary_json.get("canPark", "uncertain"),
            reason=summary_json.get("reason", "No reason provided"),
            rules=summary_json.get("rules", "No rules provided"),
            parsedText=summary_json.get("parsedText", "No text extracted"),
            advice=summary_json.get("advice", "No advice provided"),
            processing_method="gpt4o_mini_vision"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/check-parking-location", response_model=LocationCheckResponse)
async def check_parking_location(data: LocationCheckRequest) -> LocationCheckResponse:
    """
    TODO: Dummy endpoint, update later after exploring Seattle Parking CSV. 
    """
    # Here, your logic to check parking rules by lat/lng + datetime
    # For prototype, return a dummy response:
    lat, lon = 47.669253, -122.311622
    print(f"Checking parking at lat: {lat}, lon: {lon}")
    rpz_zone = get_rpz_zone(lat, lon)
    parking_category = get_parking_category(lat, lon)
    signs_nearby = get_signs_nearby(lat, lon, radius_meters=30)

    print(f"RPZ Zone: {rpz_zone}")
    print(f"Parking Category: {parking_category}")
    print(f"Nearby Signs: {signs_nearby}")

    return LocationCheckResponse(
        canPark=True,
        message=f"At location ({data.latitude:.6f}, {data.longitude:.6f}), parking is allowed from 8AM to 6PM on weekdays.",
        processing_method="location_api"
    )

@app.post("/followup-question", response_model=FollowUpResponse)
async def followup_question(req: FollowUpRequest) -> FollowUpResponse:
    """
    Handle follow-up questions based on the JSON summary
    that corresponds to a specific session ID from the frontend.
    """
    previous_summary = store.get(req.session_id)
    if not previous_summary:
        raise HTTPException(status_code=404, detail="Session ID not found")
    
    datetime_str = datetime.now().strftime("%a %I:%M%p")  # Current datetime in required format

    prompt = followup_prompt_template.format(
        previous_summary=json.dumps(previous_summary, indent=2),
        datetime_str=datetime_str,
        question=req.question
    )

    if not client:
        raise HTTPException(status_code=503, detail="OpenAI client not available")
        
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
    )

    answer = response.choices[0].message.content.strip()
    return FollowUpResponse(answer=answer)



@app.get("/health")
async def health_check():
    """Detailed health check with service status."""
    try:
        # Test OpenAI API key availability
        openai_available = bool(os.getenv("OPENAI_API_KEY"))
        
        # Test LLM service (basic check)
        llm_working = True  # Could add actual LLM test here
        
        return {
            "status": "healthy",
            "services": {
                "gpt4o": "configured" if openai_available else "missing_api_key",
                "llm": "working" if llm_working else "error",
                "parser": "working"
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)