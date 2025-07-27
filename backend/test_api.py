#!/usr/bin/env python3
"""
Test script for the CanIParkHere API
"""
import requests
import json


def test_health_endpoint():
    """Test the health check endpoint."""
    try:
        response = requests.get("http://localhost:8000/health")
        print("Health Check:", response.status_code)
        if response.status_code == 200:
            print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("❌ Server not running. Start with: python3 main.py")
        return False


def test_text_parsing():
    """Test parking check from text input."""
    try:
        test_data = {
            "sign_text": "No Parking 8am–5pm, Mon–Fri",
            "datetime_str": "Tue 4:30pm"
        }
        
        response = requests.post(
            "http://localhost:8000/check-parking-text",
            json=test_data
        )
        
        print(f"\nText Parsing Test: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Result: {result['result']}")
            print(f"Method: {result['processing_method']}")
            print(f"Parsed Rules: {result['parsed_rules']}")
        else:
            print("Error:", response.text)
            
        return response.status_code == 200
        
    except requests.exceptions.ConnectionError:
        print("❌ Server not running")
        return False


if __name__ == "__main__":
    print("🚗 Testing CanIParkHere API...")
    
    health_ok = test_health_endpoint()
    if not health_ok:
        exit(1)
    
    text_ok = test_text_parsing()
    
    if health_ok and text_ok:
        print("\n✅ All tests passed!")
        print("\n🔧 Next steps:")
        print("1. Add your OPENAI_API_KEY to .env file")
        print("2. Install Tesseract: brew install tesseract")
        print("3. Test image upload endpoint")
    else:
        print("\n❌ Some tests failed")