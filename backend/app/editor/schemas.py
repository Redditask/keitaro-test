from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator

from app.keitaro.schemas import Campaign, ResourceId, StreamOffer


class OfferToPublish(StreamOffer):
    model_config = ConfigDict(extra="forbid", strict=True)

    is_pinned: bool


class PublishOffers(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    offers: list[OfferToPublish]

    @field_validator("offers")
    @classmethod
    def valid_distribution(cls, offers: list[OfferToPublish]) -> list[OfferToPublish]:
        if len({offer.offer_id for offer in offers}) != len(offers):
            raise ValueError("An offer can appear only once in a stream.")
        if any(offer.is_pinned for offer in offers if offer.state == "disabled"):
            raise ValueError("Only active offers can have a pinned share.")
        active = [offer for offer in offers if offer.state == "active"]
        if active and sum(offer.share for offer in active) != 100:
            raise ValueError("Shares of active offers must add up to 100%.")
        return offers


class OfferView(BaseModel):
    offer_id: ResourceId
    name: str
    state: Literal["active", "disabled", "removed"]
    share: int
    is_pinned: bool


class StreamView(BaseModel):
    id: ResourceId
    name: str
    position: int
    state: str
    routing_schema: str
    is_editable: bool
    redirect_url: str | None
    country_codes: list[str]
    offers: list[OfferView]


class CampaignEditor(BaseModel):
    campaign: Campaign
    streams: list[StreamView]
