from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_signup_login_and_workspace_isolation():
    # 1. Signup User 1
    resp1 = client.post("/auth/signup", json={
        "name": "User One",
        "email": "userone@example.com",
        "password": "Password123!"
    })
    assert resp1.status_code == 201
    data1 = resp1.json()
    user1_id = str(data1["user"]["id"])
    assert data1["user"]["email"] == "userone@example.com"

    # 2. Signup User 2
    resp2 = client.post("/auth/signup", json={
        "name": "User Two",
        "email": "usertwo@example.com",
        "password": "Password123!"
    })
    assert resp2.status_code == 201
    data2 = resp2.json()
    user2_id = str(data2["user"]["id"])
    assert data2["user"]["email"] == "usertwo@example.com"

    # 3. Create a workspace for User 1
    ws1 = client.post("/workspaces", json={"name": "User 1 Exclusive Workspace"}, headers={"X-User-Id": user1_id})
    assert ws1.status_code == 201

    # 4. Create a workspace for User 2
    ws2 = client.post("/workspaces", json={"name": "User 2 Exclusive Workspace"}, headers={"X-User-Id": user2_id})
    assert ws2.status_code == 201

    # 5. List workspaces for User 1
    list1 = client.get("/workspaces", headers={"X-User-Id": user1_id})
    assert list1.status_code == 200
    names1 = [w["name"] for w in list1.json()]
    assert "User 1 Exclusive Workspace" in names1
    assert "User 2 Exclusive Workspace" not in names1

    # 6. List workspaces for User 2
    list2 = client.get("/workspaces", headers={"X-User-Id": user2_id})
    assert list2.status_code == 200
    names2 = [w["name"] for w in list2.json()]
    assert "User 2 Exclusive Workspace" in names2
    assert "User 1 Exclusive Workspace" not in names2

    # 7. Login check for User 1
    login_resp = client.post("/auth/login", json={
        "email": "userone@example.com",
        "password": "Password123!"
    })
    assert login_resp.status_code == 200
    assert login_resp.json()["user"]["email"] == "userone@example.com"
