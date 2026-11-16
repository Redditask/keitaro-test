from uuid import uuid4

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.campaigns.schemas import CreateCampaign
from app.database import KnownStreamOffer
from app.errors import ApiError
from app.keitaro.client import KeitaroClient
from app.keitaro.schemas import (
    Campaign,
    CampaignSettings,
    Offer,
    Resource,
    Stream,
)

GOOGLE_URL = "https://www.google.com"


def create_campaign(
    data: CreateCampaign, keitaro: KeitaroClient, database: Session
) -> Campaign:
    alias = uuid4().hex
    campaign_id: int | None = None
    step = "check_offer"
    try:
        offer = keitaro.request("GET", f"offers/{data.offer_id}", Offer)
        if offer.id != data.offer_id or offer.state != "active":
            raise ApiError(
                422, "offer_unavailable", "Select an active offer in Keitaro."
            )

        step = "create_campaign"
        campaign = keitaro.request(
            "POST",
            "campaigns",
            Resource,
            payload={
                "name": data.name,
                "alias": alias,
                "type": "position",
                "state": "disabled",
                "group_id": str(data.group_id),
                "domain_id": data.domain_id,
                "traffic_source_id": data.traffic_source_id,
            },
        )
        campaign_id = campaign.id

        step = "create_google_stream"
        google = keitaro.request(
            "POST",
            "streams",
            Resource,
            payload={
                "campaign_id": campaign_id,
                "name": "Google",
                "type": "regular",
                "position": 1,
                "state": "active",
                "schema": "redirect",
                "action_type": "http",
                "action_payload": GOOGLE_URL,
                "collect_clicks": True,
                "filter_or": False,
                "filters": [
                    {"name": "country", "mode": "accept", "payload": data.country_codes}
                ],
            },
        )

        step = "create_offers_stream"
        fallback = keitaro.request(
            "POST",
            "streams",
            Resource,
            payload={
                "campaign_id": campaign_id,
                "name": "Offers",
                "type": "regular",
                "position": 2,
                "state": "active",
                "schema": "landings",
                "action_type": "http",
                "collect_clicks": True,
                "filters": [],
                "landings": [],
                "offers": [{"offer_id": offer.id, "state": "active", "share": 100}],
            },
        )

        step = "verify_routes"
        streams = keitaro.request(
            "GET", f"campaigns/{campaign_id}/streams", list[Stream]
        )
        verify_routes(streams, campaign_id, google.id, fallback.id, data)

        step = "verify_settings"
        settings = keitaro.request("GET", f"campaigns/{campaign_id}", CampaignSettings)
        if (
            settings.id != campaign_id
            or settings.name != data.name
            or settings.alias != alias
            or settings.type != "position"
            or settings.state != "disabled"
            or settings.group_id != data.group_id
            or settings.domain_id != data.domain_id
            or settings.traffic_source_id != data.traffic_source_id
        ):
            raise ApiError(
                502,
                "campaign_settings_mismatch",
                "Campaign settings in Keitaro differ from the request.",
            )

        step = "save_offer_history"
        database.merge(
            KnownStreamOffer(
                stream_id=fallback.id,
                offer_id=offer.id,
                last_known_name=offer.name,
                is_pinned=False,
            )
        )
        database.commit()

        step = "activate_campaign"
        keitaro.request(
            "PUT", f"campaigns/{campaign_id}", Resource, payload={"state": "active"}
        )

        step = "verify_activation"
        active = keitaro.request("GET", f"campaigns/{campaign_id}", Campaign)
        if active.id != campaign_id or active.state != "active":
            raise ApiError(
                502,
                "campaign_activation_mismatch",
                "Keitaro did not confirm campaign activation.",
            )
        return active
    except (ApiError, SQLAlchemyError) as error:
        details: dict[str, object] = {"step": step}
        if isinstance(error, ApiError):
            details.update(error.details or {})
            if step == "check_offer" or (campaign_id is None and error.status == 422):
                raise ApiError(error.status, error.code, str(error), details) from None
            details["reason"] = str(error)
        else:
            details["reason"] = "Could not save offer history in PostgreSQL."

        details["alias"] = alias
        if campaign_id is not None:
            details["campaign_id"] = campaign_id
        raise ApiError(
            502,
            "creation_unconfirmed",
            "Campaign creation is unconfirmed. Check Keitaro before trying again.",
            details,
        ) from None


def verify_routes(
    streams: list[Stream],
    campaign_id: int,
    google_id: int,
    fallback_id: int,
    data: CreateCampaign,
) -> None:
    ordered = sorted(streams, key=lambda stream: stream.position)
    if [stream.id for stream in ordered] == [google_id, fallback_id]:
        google, fallback = ordered
        if (
            all(
                stream.campaign_id == campaign_id
                and stream.type == "regular"
                and stream.state == "active"
                for stream in ordered
            )
            and google.position == 1
            and google.name == "Google"
            and google.routing_schema == "redirect"
            and google.action_type == "http"
            and google.action_payload == GOOGLE_URL
            and not google.offers
            and len(google.filters or []) == 1
            and set(google.country_codes) == set(data.country_codes)
            and fallback.position == 2
            and fallback.name == "Offers"
            and fallback.routing_schema == "landings"
            and fallback.filters == []
            and fallback.landings == []
            and [
                (offer.offer_id, offer.state, offer.share) for offer in fallback.offers
            ]
            == [(data.offer_id, "active", 100)]
        ):
            return
    raise ApiError(
        502,
        "campaign_routes_mismatch",
        "Campaign routing in Keitaro differs from the request.",
    )
