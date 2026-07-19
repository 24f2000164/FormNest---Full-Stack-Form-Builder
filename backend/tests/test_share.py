"""Tests for the Share feature: GET /forms/{id}/share and PATCH /forms/{id}/slug.

Copy-link, QR generation, and link-preview rendering are frontend-only
concerns with no backend logic of their own - they're covered by
`public_url` being correct here, and by manual/frontend testing.
"""


def create_form_with_question(client, title="My Form"):
    r = client.post("/forms", json={"title": title})
    assert r.status_code == 201
    form = r.json()
    r = client.post(f"/forms/{form['id']}/questions", json={"type": "short_text", "title": "Name"})
    assert r.status_code == 201
    return form


def test_share_info_defaults_for_a_draft_form(client):
    form = create_form_with_question(client)
    r = client.get(f"/forms/{form['id']}/share")
    assert r.status_code == 200
    data = r.json()
    assert data["slug"] == form["slug"]
    assert data["status"] == "draft"
    assert data["published_at"] is None
    assert data["public_url"].endswith(f"/f/{form['slug']}")


def test_share_info_for_existing_forms_created_before_this_feature(client):
    # No published_at is ever set explicitly here - simulates a row that
    # existed in the DB before the column was added (migration backfills it
    # as NULL, not an error).
    form = create_form_with_question(client, title="Legacy Form")
    r = client.get(f"/forms/{form['id']}/share")
    assert r.status_code == 200
    assert r.json()["title"] == "Legacy Form"


def test_share_info_404_for_missing_form(client):
    r = client.get("/forms/999999/share")
    assert r.status_code == 404


def test_publish_sets_published_at(client):
    form = create_form_with_question(client)
    r = client.post(f"/forms/{form['id']}/publish")
    assert r.status_code == 200

    share = client.get(f"/forms/{form['id']}/share").json()
    assert share["status"] == "published"
    assert share["published_at"] is not None


def test_republishing_does_not_reset_published_at(client):
    form = create_form_with_question(client)
    client.post(f"/forms/{form['id']}/publish")
    first = client.get(f"/forms/{form['id']}/share").json()["published_at"]

    client.post(f"/forms/{form['id']}/unpublish")
    client.post(f"/forms/{form['id']}/publish")
    second = client.get(f"/forms/{form['id']}/share").json()["published_at"]

    assert first == second


def test_edit_slug_success(client):
    form = create_form_with_question(client)
    r = client.patch(f"/forms/{form['id']}/slug", json={"slug": "my-cool-form"})
    assert r.status_code == 200
    assert r.json()["slug"] == "my-cool-form"
    assert r.json()["public_url"].endswith("/f/my-cool-form")


def test_edit_slug_rejects_invalid_characters(client):
    form = create_form_with_question(client)
    for bad_slug in ["Not Valid!", "has spaces", "UPPERCASE", "trailing-", "-leading", "double--hyphen"]:
        r = client.patch(f"/forms/{form['id']}/slug", json={"slug": bad_slug})
        assert r.status_code == 422, f"expected {bad_slug!r} to be rejected"


def test_edit_slug_rejects_duplicate(client):
    form_a = create_form_with_question(client, "Form A")
    form_b = create_form_with_question(client, "Form B")
    assert client.patch(f"/forms/{form_a['id']}/slug", json={"slug": "taken-slug"}).status_code == 200

    r = client.patch(f"/forms/{form_b['id']}/slug", json={"slug": "taken-slug"})
    assert r.status_code == 409


def test_edit_slug_allows_keeping_its_own_current_slug(client):
    form = create_form_with_question(client)
    r = client.patch(f"/forms/{form['id']}/slug", json={"slug": form["slug"]})
    assert r.status_code == 200


def test_edit_slug_404_for_missing_form(client):
    r = client.patch("/forms/999999/slug", json={"slug": "whatever"})
    assert r.status_code == 404
