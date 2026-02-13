#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class ShadowScholarAPITester:
    def __init__(self, base_url="https://scholar-battle.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = "test_session_1770950938511"
        self.user_id = "test-user-1770950938511"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        resp_data = response.json()
                        print(f"   Response: {json.dumps(resp_data, indent=2)[:200]}...")
                        return True, resp_data
                    except:
                        print(f"   Response (text): {response.text[:200]}...")
                        return True, response.text
                return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Timeout (30s)")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_me(self):
        """Test authentication and user info"""
        return self.run_test("Auth Me", "GET", "auth/me", 200)

    def test_dashboard(self):
        """Test dashboard data"""
        return self.run_test("Dashboard", "GET", "dashboard", 200)

    def test_activities_list(self):
        """Test activities list"""
        return self.run_test("Activities List", "GET", "activities", 200)

    def test_rankings_global(self):
        """Test global rankings"""
        return self.run_test("Global Rankings", "GET", "rankings/global", 200)

    def test_create_activity(self):
        """Test creating an activity"""
        activity_data = {
            "title": "Test Activity",
            "subject": "Matemática",
            "description": "Test description",
            "difficulty": 3,
            "estimated_time": 30
        }
        success, response = self.run_test("Create Activity", "POST", "activities", 201, activity_data)
        if success:
            return success, response.get('activity_id')
        return False, None

    def test_friends(self):
        """Test friends endpoint"""
        return self.run_test("Friends List", "GET", "friends", 200)

    def test_clan_list(self):
        """Test clan list"""  
        return self.run_test("Clan List", "GET", "clans", 200)

    def test_shop_items(self):
        """Test shop items"""
        return self.run_test("Shop Items", "GET", "shop/items", 200)

    def test_profile(self):
        """Test user profile"""
        return self.run_test("User Profile", "GET", f"users/{self.user_id}", 200)

def main():
    print("🚀 Shadow Scholar API Testing")
    print("="*50)
    
    # Setup
    tester = ShadowScholarAPITester()
    
    # Run core API tests
    tester.test_auth_me()
    tester.test_dashboard()
    tester.test_activities_list()
    tester.test_rankings_global()
    
    # Create an activity to test POST endpoint
    success, activity_id = tester.test_create_activity()
    
    # Test other endpoints
    tester.test_friends()
    tester.test_clan_list() 
    tester.test_shop_items()
    tester.test_profile()

    # Print final results
    print(f"\n📊 Final Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.tests_passed == tester.tests_run:
        print("✅ All backend APIs working correctly!")
        return 0
    else:
        print("❌ Some backend APIs failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())