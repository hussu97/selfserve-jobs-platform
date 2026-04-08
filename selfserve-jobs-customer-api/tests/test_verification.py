async def test_verify_invalid_code(client):
    response = await client.post("/api/v1/verify/", json={"code": "this-code-does-not-exist-at-all-12345678"})
    assert response.status_code == 400


async def test_resend_missing_fields(client):
    response = await client.post("/api/v1/verify/resend", json={})
    assert response.status_code == 422
