import json
from collections.abc import Callable, Iterator
from contextlib import contextmanager

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.database import KnownStreamOffer, get_session
from app.keitaro.client import KeitaroClient, get_keitaro
from app.main import create_app
from app.settings import Settings


@contextmanager
def relay_client(
    upstream: Callable[[httpx.Request], httpx.Response], database: Engine | None = None
) -> Iterator[TestClient]:
    app = create_app(
        Settings(database_url=None, keitaro_base_url=None, keitaro_api_key=None)
    )

    def session() -> Iterator[Session]:
        with Session(database) as database_session:
            yield database_session

    with httpx.Client(
        base_url="https://keitaro.example/admin_api/v1/",
        transport=httpx.MockTransport(upstream),
    ) as http:
        app.dependency_overrides[get_keitaro] = lambda: KeitaroClient(http)
        app.dependency_overrides[get_session] = session
        with TestClient(app) as client:
            yield client


def campaign(
    id: int = 123, name: str = "Campaign", state: str = "active"
) -> dict[str, object]:
    return {"id": id, "name": name, "state": state}


def offer(id: int, share: int, state: str = "active") -> dict[str, object]:
    return {"offer_id": id, "share": share, "state": state}


def stream(offers: list[dict[str, object]]) -> dict[str, object]:
    return {
        "id": 77,
        "campaign_id": 123,
        "position": 2,
        "name": "Offers",
        "state": "active",
        "schema": "landings",
        "offers": offers,
    }


def test_campaign_page_preserves_order_without_total() -> None:
    def upstream(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/admin_api/v1/campaigns"
        assert dict(request.url.params) == {"limit": "21", "offset": "20"}
        return httpx.Response(200, json=[campaign(id) for id in range(50, 29, -1)])

    with relay_client(upstream) as client:
        assert client.get("/api/campaigns", params={"page": 2}).json() == {
            "items": [campaign(id) for id in range(50, 30, -1)],
            "page": 2,
            "has_next": True,
        }


def test_offer_search_prioritizes_exact_id_and_hides_disabled_offers() -> None:
    def upstream(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/admin_api/v1/offers"
        return httpx.Response(
            200,
            json=[
                {"id": 1, "name": "A 12", "state": "active"},
                {"id": 2, "name": "B 12", "state": "disabled"},
                {"id": 12, "name": "Z", "state": "active"},
            ],
        )

    with relay_client(upstream) as client:
        assert client.get("/api/offers", params={"search_term": " 12 "}).json() == [
            {"id": 12, "name": "Z"},
            {"id": 1, "name": "A 12"},
        ]


@pytest.mark.parametrize(
    "offers",
    [
        [offer(10, 25)],
        [offer(10, 50), offer(10, 50)],
        [offer(10, 101)],
    ],
)
def test_publish_rejects_invalid_distributions_before_upstream(
    offers: list[dict[str, object]],
) -> None:
    def upstream(request: httpx.Request) -> httpx.Response:
        raise AssertionError("Invalid data reached Keitaro")

    with relay_client(upstream) as client:
        response = client.put(
            "/api/campaigns/123/streams/77/offers",
            json={
                "offers": [item | {"is_pinned": False} for item in offers],
            },
        )
        assert response.status_code == 422
        assert response.json()["code"] == "validation_error"


def test_create_keeps_partial_campaign_disabled() -> None:
    requests: list[tuple[str, str]] = []

    def upstream(request: httpx.Request) -> httpx.Response:
        path = request.url.path.removeprefix("/admin_api/v1/")
        requests.append((request.method, path))
        if path == "offers/10":
            return httpx.Response(
                200, json={"id": 10, "name": "Catalog name", "state": "active"}
            )
        if path == "campaigns":
            assert json.loads(request.content)["state"] == "disabled"
            return httpx.Response(200, json={"id": 123})
        return httpx.Response(
            406,
            json={
                "filters": ["Invalid value."],
                "unexpected_field": ["Unexpected response content"],
            },
        )

    with relay_client(upstream) as client:
        response = client.post(
            "/api/campaigns",
            json={
                "name": "Campaign",
                "country_codes": ["AU"],
                "group_id": 99,
                "domain_id": 101,
                "traffic_source_id": 303,
                "offer_id": 10,
            },
        )
    assert response.status_code == 502
    details = response.json()["details"]
    assert details["campaign_id"] == 123
    assert details["step"] == "create_google_stream"
    assert details["upstream_status"] == 406
    assert details["fields"] == ["filters"]
    assert details["reason"] == "Keitaro rejected the request."
    assert "Invalid value." not in response.text
    assert "Unexpected response content" not in response.text
    assert requests == [
        ("GET", "offers/10"),
        ("POST", "campaigns"),
        ("POST", "streams"),
    ]


def test_create_checks_routes_and_seeds_known_offer_before_activation(
    migrated_database: Engine,
) -> None:
    sent_streams: list[dict[str, object]] = []
    saved_campaign: dict[str, object] = {}

    def upstream(request: httpx.Request) -> httpx.Response:
        path = request.url.path.removeprefix("/admin_api/v1/")
        if (request.method, path) == ("GET", "offers/19"):
            return httpx.Response(
                200, json={"id": 19, "name": "Catalog name", "state": "active"}
            )
        if (request.method, path) == ("POST", "campaigns"):
            data = json.loads(request.content)
            assert data["name"] == "Test Campaign"
            assert data["name"] != data["alias"]
            assert data["group_id"] == "99"
            assert data["domain_id"] == 101
            assert data["traffic_source_id"] == 303
            saved_campaign.update({"id": 123, **data})
            return httpx.Response(200, json=saved_campaign)
        if (request.method, path) == ("POST", "streams"):
            data = json.loads(request.content)
            sent_streams.append({"offers": [], "id": 800 + len(sent_streams), **data})
            return httpx.Response(200, json=sent_streams[-1])
        if path == "campaigns/123/streams":
            assert [item["position"] for item in sent_streams] == [1, 2]
            assert sent_streams[0]["filters"] == [
                {"name": "country", "mode": "accept", "payload": ["AU", "MX"]}
            ]
            assert sent_streams[1]["offers"] == [offer(19, 100)]
            return httpx.Response(200, json=sent_streams[::-1])
        if (request.method, path) == ("PUT", "campaigns/123"):
            with Session(migrated_database) as database:
                known = database.get(KnownStreamOffer, (801, 19))
                assert known is not None and known.last_known_name == "Catalog name"
            assert json.loads(request.content) == {"state": "active"}
            saved_campaign.update(state="active")
            return httpx.Response(200, json=saved_campaign)
        assert (request.method, path) == ("GET", "campaigns/123")
        return httpx.Response(200, json=saved_campaign)

    with relay_client(upstream, migrated_database) as client:
        response = client.post(
            "/api/campaigns",
            json={
                "name": " Test Campaign ",
                "country_codes": ["AU", "MX"],
                "group_id": 99,
                "domain_id": 101,
                "traffic_source_id": 303,
                "offer_id": 19,
            },
        )
    assert response.status_code == 201
    assert response.json() == campaign(name="Test Campaign")


def test_history_and_unconfirmed_push_can_be_reconciled(
    migrated_database: Engine,
) -> None:
    remote_offers = [offer(10, 25), offer(20, 25), offer(30, 7, "disabled")]
    catalog_names = {10: "First", 20: "Second", 30: "Disabled"}
    expected = [offer(10, 100), offer(30, 7, "disabled")]
    put_count = 0
    unavailable = False

    def upstream(request: httpx.Request) -> httpx.Response:
        nonlocal put_count, unavailable
        path = request.url.path.removeprefix("/admin_api/v1/")
        if path == "campaigns/123":
            return httpx.Response(200, json=campaign())
        if path == "campaigns/123/streams":
            if unavailable:
                return httpx.Response(200, json=[{"id": 77}])
            return httpx.Response(200, json=[stream(remote_offers)])
        if path == "offers":
            return httpx.Response(
                200,
                json=[
                    {"id": offer_id, "name": name, "state": "active"}
                    for offer_id, name in catalog_names.items()
                ],
            )
        assert path == "streams/77"
        if request.method == "PUT":
            assert json.loads(request.content) == {"offers": expected}
            remote_offers[:] = expected
            put_count += 1
            raise httpx.ReadTimeout("write applied, response lost")
        return httpx.Response(200, json=stream(remote_offers))

    sync_path = "/api/campaigns/123/sync"
    push_path = "/api/campaigns/123/streams/77/offers"
    payload = {
        "offers": [item | {"is_pinned": item["offer_id"] == 10} for item in expected]
    }
    with relay_client(upstream, migrated_database) as client:
        before = client.post(sync_path).json()["streams"][0]["offers"]
        assert [item["share"] for item in before] == [25, 25, 7]
        response = client.put(push_path, json=payload)
        assert (
            response.status_code == 502
            and response.json()["code"] == "publication_unconfirmed"
        )
        with Session(migrated_database) as database:
            known = database.get(KnownStreamOffer, (77, 10))
            assert known is not None and not known.is_pinned

        response = client.put(push_path, json=payload)
        assert response.status_code == 200
        assert put_count == 1
        assert response.json()["offers"] == [
            expected[0] | {"name": "First", "is_pinned": True},
            expected[1] | {"name": "Disabled", "is_pinned": False},
            offer(20, 0, "removed") | {"name": "Second", "is_pinned": False},
        ]

        unavailable = True
        assert client.post(sync_path).status_code == 502
        unavailable = False
        remote_offers[:] = [offer(10, 75), offer(20, 25)]
        catalog_names[10] = "New first name"
        latest = client.post(sync_path).json()["streams"][0]["offers"]
        assert latest[0] == offer(10, 75) | {
            "name": "New first name",
            "is_pinned": True,
        }
        remote_offers[:] = [offer(20, 100)]
        latest = client.post(sync_path).json()["streams"][0]["offers"]
        assert latest[1] == offer(10, 0, "removed") | {
            "name": "New first name",
            "is_pinned": False,
        }
        remote_offers[:] = [offer(10, 100)]
        latest = client.post(sync_path).json()["streams"][0]["offers"]
        assert latest[0] == offer(10, 100) | {
            "name": "New first name",
            "is_pinned": False,
        }
