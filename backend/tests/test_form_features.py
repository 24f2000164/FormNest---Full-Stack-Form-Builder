import pytest

def test_form_crud(client):
    # 1. Create a form
    r = client.post("/forms", json={"title": "Interactive Survey"})
    assert r.status_code == 201
    form = r.json()
    assert form["title"] == "Interactive Survey"
    assert form["status"] == "draft"

    # 2. Add short text & email questions
    r1 = client.post(f"/forms/{form['id']}/questions", json={
        "type": "short_text",
        "title": "Your Username",
        "required": True
    })
    assert r1.status_code == 201
    q1 = r1.json()

    r2 = client.post(f"/forms/{form['id']}/questions", json={
        "type": "email",
        "title": "Your Mailbox",
        "required": False
    })
    assert r2.status_code == 201

    # 3. Fetch form builder view
    r = client.get(f"/forms/{form['id']}")
    assert r.status_code == 200
    data = r.json()
    assert len(data["questions"]) == 2
    assert data["questions"][0]["type"] == "short_text"


def test_form_settings_variables(client):
    # Create form
    r = client.post("/forms", json={"title": "Vars Test"})
    form = r.json()

    # Update form settings with custom variables & sheets connection
    settings_payload = {
        "variables": {
            "score": 10,
            "price": 49.99,
            "segment": "Enterprise",
            "custom": [{"key": "userId", "value": "12345"}]
        },
        "googleSheets": {
            "connected": True,
            "spreadsheetId": "sheet-id-abc",
            "spreadsheetName": "User Signups Log"
        }
    }
    r = client.patch(f"/forms/{form['id']}", json={
        "settings": settings_payload
    })
    assert r.status_code == 200
    updated = r.json()
    assert updated["settings"]["variables"]["score"] == 10
    assert updated["settings"]["googleSheets"]["connected"] is True


def test_workspace_management(client):
    # 1. Create workspace
    r = client.post("/workspaces", json={"name": "New Team Workspace"})
    assert r.status_code == 201
    new_ws = r.json()
    assert new_ws["name"] == "New Team Workspace"

    # 2. Fetch workspaces list
    r = client.get("/workspaces")
    assert r.status_code == 200
    workspaces = r.json()
    assert len(workspaces) >= 1

    # 3. Rename workspace
    r = client.patch(f"/workspaces/{new_ws['id']}", json={"name": "Collaborators Workspace"})
    assert r.status_code == 200
    assert r.json()["name"] == "Collaborators Workspace"
