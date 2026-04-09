VALID_PROFILE_PAYLOAD = {
    "person_name": "Jane Smith",
    "email": "jane@example.com",
    "contact_number": "+44 7700 900123",
    "brief": "Experienced software engineer with 8 years of experience building scalable "
    "web applications and APIs. Passionate about clean code and best practices.",
    "current_city": "Manchester",
    "current_country": "United Kingdom",
    "years_of_experience": 8,
    "current_title": "Senior Software Engineer",
    "relocation_preference": "open",
    "key_skills": ["Python", "Django", "PostgreSQL"],
}


async def test_list_profiles_empty(client):
    response = await client.get("/api/v1/profiles")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["items"] == []
    assert data["total"] == 0


async def test_create_profile_missing_fields(client):
    response = await client.post("/api/v1/profiles", json={})
    assert response.status_code == 422


async def test_create_profile_valid(client):
    response = await client.post("/api/v1/profiles", json=VALID_PROFILE_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert "code" in data
    assert len(data["code"]) == 12
    assert "message" in data
