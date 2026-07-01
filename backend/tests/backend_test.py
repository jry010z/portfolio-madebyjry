"""Backend tests for JRY OS Portfolio API.

Covers:
- Work CRUD (with category filter) + admin passcode auth
- Network CRUD + admin passcode auth
- Admin verify endpoint
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://content-hub-1549.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
PASSCODE = "jry2026"
WRONG_PASS = "wrong123"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --------- Admin verify ---------
class TestAdminVerify:
    def test_verify_correct(self, session):
        r = session.post(f"{API}/admin/verify", json={"passcode": PASSCODE})
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_verify_wrong(self, session):
        r = session.post(f"{API}/admin/verify", json={"passcode": WRONG_PASS})
        assert r.status_code == 401


# --------- Work endpoints ---------
class TestWork:
    def test_get_all_work_seeded(self, session):
        r = session.get(f"{API}/work")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 13, f"Expected >=13 seeded items, got {len(data)}"
        # ensure _id not exposed
        assert all("_id" not in it for it in data)
        # required fields
        for it in data:
            assert "id" in it and "category" in it and "title" in it and "image_url" in it

    @pytest.mark.parametrize("cat", ["thumbnail", "short", "longform", "design"])
    def test_filter_category(self, session, cat):
        r = session.get(f"{API}/work", params={"category": cat})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(it["category"] == cat for it in data)

    def test_create_work_no_passcode(self, session):
        payload = {"category": "thumbnail", "title": "TEST_nopass", "image_url": "http://x/y.jpg"}
        r = session.post(f"{API}/work", json=payload)
        assert r.status_code == 401

    def test_create_work_wrong_passcode(self, session):
        payload = {"category": "thumbnail", "title": "TEST_wrong", "image_url": "http://x/y.jpg"}
        r = session.post(f"{API}/work", json=payload, headers={"X-Admin-Passcode": WRONG_PASS})
        assert r.status_code == 401

    def test_create_and_delete_work(self, session):
        payload = {
            "category": "design",
            "title": "TEST_workitem",
            "subtitle": "unit test",
            "image_url": "https://example.com/img.jpg",
            "link": "",
            "order": 99,
        }
        r = session.post(f"{API}/work", json=payload, headers={"X-Admin-Passcode": PASSCODE})
        assert r.status_code == 200, r.text
        item = r.json()
        assert item["title"] == "TEST_workitem"
        assert item["category"] == "design"
        assert "id" in item and isinstance(item["id"], str)
        item_id = item["id"]

        # verify persistence via GET
        r2 = session.get(f"{API}/work", params={"category": "design"})
        assert r2.status_code == 200
        assert any(i["id"] == item_id for i in r2.json())

        # delete without passcode
        r_bad = session.delete(f"{API}/work/{item_id}")
        assert r_bad.status_code == 401

        # delete with passcode
        r_del = session.delete(f"{API}/work/{item_id}", headers={"X-Admin-Passcode": PASSCODE})
        assert r_del.status_code == 200
        assert r_del.json().get("ok") is True

        # verify removal
        r3 = session.get(f"{API}/work", params={"category": "design"})
        assert not any(i["id"] == item_id for i in r3.json())

    def test_delete_nonexistent_work(self, session):
        r = session.delete(f"{API}/work/nonexistent-id-xyz", headers={"X-Admin-Passcode": PASSCODE})
        assert r.status_code == 404


# --------- Network endpoints ---------
class TestNetwork:
    def test_get_network_seeded(self, session):
        r = session.get(f"{API}/network")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 6, f"Expected >=6 clients, got {len(data)}"
        assert all("_id" not in c for c in data)
        for c in data:
            assert "id" in c and "name" in c and "followers" in c and "logo_url" in c

    def test_create_client_no_passcode(self, session):
        payload = {"name": "TEST_client", "followers": "1M+", "logo_url": "http://x/y.jpg"}
        r = session.post(f"{API}/network", json=payload)
        assert r.status_code == 401

    def test_create_and_delete_client(self, session):
        payload = {"name": "TEST_client_a", "followers": "9M+", "logo_url": "https://example.com/l.jpg", "link": "", "order": 100}
        r = session.post(f"{API}/network", json=payload, headers={"X-Admin-Passcode": PASSCODE})
        assert r.status_code == 200, r.text
        client = r.json()
        assert client["name"] == "TEST_client_a"
        assert client["followers"] == "9M+"
        cid = client["id"]

        # verify GET
        r2 = session.get(f"{API}/network")
        assert any(c["id"] == cid for c in r2.json())

        # delete without passcode
        r_bad = session.delete(f"{API}/network/{cid}")
        assert r_bad.status_code == 401

        # delete
        r_del = session.delete(f"{API}/network/{cid}", headers={"X-Admin-Passcode": PASSCODE})
        assert r_del.status_code == 200

        # verify removal
        r3 = session.get(f"{API}/network")
        assert not any(c["id"] == cid for c in r3.json())
