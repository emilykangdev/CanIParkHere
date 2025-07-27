# CanIParkHere

## Why I Built This

Got too many parking tickets in Seattle. Tired of squinting at confusing parking signs and getting $60 surprises on my windshield. 

## What It Does

Upload a photo of any parking sign, and get instant, clear answers about whether you can park there right now.

- **Smart "OCR"**: Reads parking signs using GPT-4 Vision (gpt4o-mini)
- **Time-aware**: Considers current day/time for accurate decisions  
- **Follow-up questions**: Ask things like "What about tomorrow at 3pm?"
- **Mobile-first**: Fast, clean interface for quick decisions

## Current Status

 **MVP Complete**
- Photo upload with compression
- AI parking sign analysis
- Real-time parking decisions
- Follow-up question system
- Base64 image storage (work in progress, should show images in chat)

## What I'm Working On

### Near Term
- **Better image rendering** - Show multiple photos in chat history
- **Seattle parking data integration** - Cross-reference with official city data
- **Resource menu** - Quick links to Seattle parking maps and regulations
- **UI** - Might move onto a chat library instead of making a funky chat screen from scratch. 

### Future Ideas  
- **Enhanced mapping** - Because Seattle's parking map interface is... not great =
- **Location-based lookup** - "Can I park here?" without taking a photo
- **Parking violation predictions** - "This spot gets tickets often"
- **Mobile app wrapper** - Install from browser for native feel

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS
- **Backend**: Python FastAPI + OpenAI GPT-4o-mini
- **Architecture**: Monorepo with shared types via OpenAPI
- **Image Processing**: Browser-based compression + base64 storage
- **No external dependencies**: Runs locally, no cloud storage needed

## Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python main.py

# Frontend  
cd my-app
npm install
npm run dev
```

Add your OpenAI API key to `backend/.env`:
```
OPENAI_API_KEY=your_key_here
```

## The Problem with Seattle Parking

Seattle's parking signs are notoriously confusing. Multiple overlapping rules, time restrictions, permit zones, and street cleaning schedules can be a bit confusing to navigate. The city's online resources exist, and they're honestly pretty good! Like these:

- https://www.seattle.gov/transportation/getting-around/driving-and-parking
- https://www.seattle.gov/transportation/projects-and-programs/programs/parking-program/parking-regulations
- https://www.seattle.gov/documents/Departments/SDOT/ParkingProgram/CanIParkHereBrochure.pdf 

But they're easy to forget, and they're hard to read on phones. 

This tool cuts through the confusion: point, shoot a picture, YES/NO for parking.