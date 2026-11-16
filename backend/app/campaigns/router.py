from typing import Annotated

from fastapi import APIRouter, Query

from app.campaigns import creation
from app.campaigns.schemas import CampaignListResponse, CampaignOptions, CreateCampaign
from app.database import Database
from app.keitaro.client import Keitaro
from app.keitaro.schemas import Campaign, NamedResource, Offer

router = APIRouter(prefix="/api", tags=["campaigns"])
PAGE_SIZE = 20


@router.get("/campaigns")
def get_campaigns(
    keitaro: Keitaro, page: Annotated[int, Query(ge=1)] = 1
) -> CampaignListResponse:
    campaigns = keitaro.request(
        "GET",
        "campaigns",
        list[Campaign],
        params={"limit": PAGE_SIZE + 1, "offset": (page - 1) * PAGE_SIZE},
    )
    return CampaignListResponse(
        items=campaigns[:PAGE_SIZE], page=page, has_next=len(campaigns) > PAGE_SIZE
    )


@router.get("/campaign-options")
def get_campaign_options(keitaro: Keitaro) -> CampaignOptions:
    return CampaignOptions(
        groups=keitaro.request(
            "GET", "groups", list[NamedResource], params={"type": "campaigns"}
        ),
        domains=keitaro.request("GET", "domains", list[NamedResource]),
        traffic_sources=keitaro.request("GET", "traffic_sources", list[NamedResource]),
    )


@router.get("/offers")
def search_offers(keitaro: Keitaro, search_term: str = "") -> list[NamedResource]:
    term = search_term.strip().casefold()
    if not term:
        return []

    offers = keitaro.request("GET", "offers", list[Offer])
    matches: list[NamedResource] = [
        offer
        for offer in offers
        if offer.state == "active"
        and (term in offer.name.casefold() or term in str(offer.id))
    ]
    matches.sort(
        key=lambda offer: (str(offer.id) != term, offer.name.casefold(), offer.id)
    )
    return matches[:20]


@router.post("/campaigns", status_code=201)
def create_campaign(
    data: CreateCampaign, keitaro: Keitaro, database: Database
) -> Campaign:
    return creation.create_campaign(data, keitaro, database)
