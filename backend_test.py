#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import os

class ShadowScholarAPITester:
    def __init__(self, base_url="https://scholar-battle.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = "test_session_1770948283020"  # From mongosh setup
        self.user_id = "test-user-1770948283020"  # From mongosh setup
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def headers(self):
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/api{endpoint}"
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        if description:
            print(f"   {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers())
            elif method == 'POST':
                response = requests.post(url, json=data, headers=self.headers())
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=self.headers())
            elif method == 'DELETE':
                response = requests.delete(url, headers=self.headers())

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.content else {}
                    self.test_results.append({
                        "test": name,
                        "status": "PASSED",
                        "endpoint": endpoint,
                        "response_code": response.status_code,
                        "has_data": bool(response_data)
                    })
                    return success, response_data
                except:
                    self.test_results.append({
                        "test": name,
                        "status": "PASSED",
                        "endpoint": endpoint,
                        "response_code": response.status_code,
                        "has_data": False
                    })
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json() if response.content else {}
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                
                self.test_results.append({
                    "test": name,
                    "status": "FAILED",
                    "endpoint": endpoint,
                    "expected_code": expected_status,
                    "actual_code": response.status_code,
                    "error": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "test": name,
                "status": "ERROR",
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTH ENDPOINTS")
        print("="*50)
        
        # Test auth/me
        success, user_data = self.run_test(
            "Get Current User", "GET", "/auth/me", 200,
            description="Verify authentication with session token"
        )
        
        return user_data if success else {}

    def test_dashboard(self):
        """Test dashboard endpoint"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD")
        print("="*50)
        
        success, data = self.run_test(
            "Dashboard Data", "GET", "/dashboard", 200,
            description="Get dashboard with XP, level info, missions, goals"
        )
        
        if success and data:
            # Verify dashboard has required fields
            required_fields = ['today_xp', 'level_info', 'total_xp', 'streak', 'missions', 'weekly_goals']
            missing = [field for field in required_fields if field not in data]
            if missing:
                print(f"⚠️  Dashboard missing fields: {missing}")
            else:
                print(f"✅ Dashboard has all required fields")
        
        return data if success else {}

    def test_activities_crud(self):
        """Test activities CRUD operations"""
        print("\n" + "="*50)
        print("TESTING ACTIVITIES CRUD")
        print("="*50)
        
        # Create activity
        activity_data = {
            "title": "Test Activity Matemática",
            "subject": "Matemática", 
            "description": "Test activity for API testing",
            "difficulty": 3,
            "estimated_time": 45
        }
        
        success, created_activity = self.run_test(
            "Create Activity", "POST", "/activities", 201, activity_data,
            description="Create new activity with anti-fraud validation"
        )
        
        activity_id = created_activity.get("activity_id") if success else None
        
        # List activities
        self.run_test(
            "List Activities", "GET", "/activities", 200,
            description="Get all activities for user"
        )
        
        # List with filters
        self.run_test(
            "List Pending Activities", "GET", "/activities?status=pending", 200,
            description="Get pending activities only"
        )
        
        if activity_id:
            # Complete activity
            success, completion_data = self.run_test(
                "Complete Activity", "POST", f"/activities/{activity_id}/complete", 200,
                description="Complete activity and calculate XP"
            )
            
            if success and completion_data:
                xp_earned = completion_data.get("xp_earned", 0)
                print(f"✅ Activity completed with {xp_earned} XP")
            
            # Delete activity  
            self.run_test(
                "Delete Activity", "DELETE", f"/activities/{activity_id}", 200,
                description="Remove activity from user's list"
            )

    def test_rankings(self):
        """Test ranking endpoints"""
        print("\n" + "="*50)
        print("TESTING RANKINGS")
        print("="*50)
        
        self.run_test(
            "Global Ranking", "GET", "/rankings/global", 200,
            description="Get today's global XP ranking"
        )
        
        self.run_test(
            "Streak Ranking", "GET", "/rankings/streak", 200,
            description="Get streak-based ranking"
        )
        
        self.run_test(
            "Friends Ranking", "GET", "/rankings/friends", 200,
            description="Get ranking among friends"
        )
        
        self.run_test(
            "Clans Ranking", "GET", "/rankings/clans", 200,
            description="Get clan-based ranking"
        )

    def test_shop(self):
        """Test shop endpoints"""
        print("\n" + "="*50)
        print("TESTING SHOP")
        print("="*50)
        
        success, shop_data = self.run_test(
            "Get Shop Items", "GET", "/shop", 200,
            description="Get all 15 seeded shop items"
        )
        
        if success and shop_data:
            items = shop_data.get("items", [])
            print(f"✅ Shop has {len(items)} items")
            
            # Try to buy a cheap item if user has enough XP
            total_xp = shop_data.get("total_xp", 0)
            cheap_item = None
            for item in items:
                if item.get("price", 9999) <= total_xp and not item.get("owned", False):
                    cheap_item = item
                    break
            
            if cheap_item:
                self.run_test(
                    "Buy Shop Item", "POST", f"/shop/buy/{cheap_item['item_id']}", 200,
                    description=f"Purchase {cheap_item['name']} for {cheap_item['price']} XP"
                )

    def test_friends_system(self):
        """Test friends and social features"""
        print("\n" + "="*50)
        print("TESTING FRIENDS SYSTEM")
        print("="*50)
        
        self.run_test(
            "List Friends", "GET", "/friends", 200,
            description="Get user's friends, pending requests"
        )
        
        self.run_test(
            "Search Users", "GET", "/friends/search?q=Test", 200,
            description="Search for other users by display name"
        )

    def test_clans(self):
        """Test clan system"""
        print("\n" + "="*50)
        print("TESTING CLANS")
        print("="*50)
        
        self.run_test(
            "List Clans", "GET", "/clans", 200,
            description="Get all available clans"
        )

    def test_profile(self):
        """Test profile endpoints"""
        print("\n" + "="*50)
        print("TESTING PROFILE")
        print("="*50)
        
        success, profile_data = self.run_test(
            "Get Profile", "GET", "/profile", 200,
            description="Get user profile with level info"
        )
        
        # Update profile
        profile_update = {
            "bio": "Updated bio for testing",
            "profile_color": "#ff5533"
        }
        
        self.run_test(
            "Update Profile", "PUT", "/profile", 200, profile_update,
            description="Update user profile information"
        )

    def test_subjects(self):
        """Test subjects management"""  
        print("\n" + "="*50)
        print("TESTING SUBJECTS")
        print("="*50)
        
        self.run_test(
            "Get Subjects", "GET", "/subjects", 200,
            description="Get user's subjects list"
        )
        
        # Add new subject
        new_subject = {"name": "Física"}
        self.run_test(
            "Add Subject", "POST", "/subjects", 200, new_subject,
            description="Add new subject to user's list"
        )

    def test_missions_and_goals(self):
        """Test missions and weekly goals"""
        print("\n" + "="*50)
        print("TESTING MISSIONS & GOALS")
        print("="*50)
        
        self.run_test(
            "Get Missions", "GET", "/missions", 200,
            description="Get daily missions for user"
        )
        
        self.run_test(
            "Get Weekly Goals", "GET", "/goals", 200,
            description="Get weekly goals progress"
        )

    def test_badges(self):
        """Test badges system"""
        print("\n" + "="*50)
        print("TESTING BADGES")
        print("="*50)
        
        self.run_test(
            "Get Badges", "GET", "/badges", 200,
            description="Get all available badges and user's earned badges"
        )

    def test_onboarding_validation(self):
        """Test onboarding display_name uniqueness"""
        print("\n" + "="*50)
        print("TESTING ONBOARDING VALIDATION") 
        print("="*50)
        
        # Try to use existing display name (should fail)
        existing_name_data = {
            "display_name": "TestUser1770948283020",  # This should already exist
            "city": "Rio de Janeiro",
            "school": "Test School",
            "grade": "2º Ano EM",
            "subjects": ["História", "Geografia"]
        }
        
        self.run_test(
            "Duplicate Display Name", "POST", "/onboarding", 400, existing_name_data,
            description="Should fail with duplicate display name"
        )

def main():
    print("🚀 Starting Shadow Scholar API Tests")
    print("=" * 60)
    
    tester = ShadowScholarAPITester()
    
    # Test auth first
    user_data = tester.test_auth_endpoints()
    if not user_data:
        print("❌ Authentication failed - stopping tests")
        return 1
    
    print(f"✅ Authenticated as: {user_data.get('display_name', 'Unknown')}")
    
    # Run all test suites
    test_suites = [
        tester.test_dashboard,
        tester.test_activities_crud,
        tester.test_rankings,
        tester.test_shop,
        tester.test_friends_system,
        tester.test_clans,
        tester.test_profile,
        tester.test_subjects,
        tester.test_missions_and_goals,
        tester.test_badges,
        tester.test_onboarding_validation
    ]
    
    for test_suite in test_suites:
        try:
            test_suite()
        except Exception as e:
            print(f"❌ Test suite failed: {str(e)}")
    
    # Print final results
    print("\n" + "="*60)
    print("📊 TEST RESULTS SUMMARY")
    print("="*60)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Save detailed results
    with open('/tmp/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'failed_tests': tester.tests_run - tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0
            },
            'detailed_results': tester.test_results,
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📝 Detailed results saved to: /tmp/backend_test_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())