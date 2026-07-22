from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_google_auth_new_and_existing_user():
    mock_token_info = {
        "email": "googletestuser@example.com",
        "name": "Google Test User",
        "sub": "123456789"
    }

    with patch("app.routers.auth.verify_google_token", return_value=mock_token_info):
        # First call: Should register new user
        resp1 = client.post("/auth/google", json={"credential": "valid_dummy_credential_123"})
        assert resp1.status_code == 200
        data1 = resp1.json()
        assert data1["status"] == "success"
        assert data1["user"]["email"] == "googletestuser@example.com"
        assert data1["user"]["name"] == "Google Test User"
        assert "token" in data1

        # Second call: Should log in existing user
        resp2 = client.post("/auth/google", json={"credential": "valid_dummy_credential_123"})
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["status"] == "success"
        assert data2["user"]["id"] == data1["user"]["id"]


def test_google_auth_invalid_token():
    with patch("app.routers.auth.verify_google_token", return_value={}):
        resp = client.post("/auth/google", json={"credential": "invalid_credential"})
        assert resp.status_code == 400
        assert "Invalid Google OAuth token" in resp.json()["detail"]
