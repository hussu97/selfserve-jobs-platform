import pytest


VALID_JOB_PAYLOAD = {
    "email": "test@example.com",
    "job_title": "Software Engineer",
    "company_name": "Acme Corp",
    "company_city": "London",
    "company_country": "United Kingdom",
    "employment_type": "full_time",
    "description": "We are looking for a talented software engineer to join our growing team. "
    "You will work on exciting projects and collaborate with a world-class team.",
    "contact_method": "email",
    "contact_email": "hiring@example.com",
    "key_skills": ["Python", "FastAPI"],
}


async def test_list_jobs_empty(client):
    response = await client.get("/api/v1/jobs/")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["items"] == []
    assert data["total"] == 0


async def test_create_job_missing_fields(client):
    response = await client.post("/api/v1/jobs/", json={})
    assert response.status_code == 422


async def test_create_job_honeypot_rejected(client):
    payload = {**VALID_JOB_PAYLOAD, "website": "http://spam.example.com"}
    response = await client.post("/api/v1/jobs/", json=payload)
    assert response.status_code == 400


async def test_create_job_valid(client):
    response = await client.post("/api/v1/jobs/", json=VALID_JOB_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert "code" in data
    assert len(data["code"]) == 12
    assert "message" in data
