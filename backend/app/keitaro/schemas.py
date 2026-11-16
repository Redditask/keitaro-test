from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator

ResourceId = Annotated[int, Field(gt=0, le=2**63 - 1)]
OfferState = Literal["active", "disabled"]


class Resource(BaseModel):
    id: ResourceId


class NamedResource(Resource):
    name: str


class Campaign(NamedResource):
    state: str


class CampaignSettings(Campaign):
    alias: str
    type: str
    group_id: int
    domain_id: int | None = None
    traffic_source_id: int | None = None


class Offer(NamedResource):
    state: str


class StreamOffer(BaseModel):
    offer_id: ResourceId
    state: OfferState
    share: int = Field(ge=0, le=100)


class StreamFilter(BaseModel):
    name: str
    mode: str
    payload: object


class Stream(NamedResource):
    campaign_id: ResourceId
    position: int
    state: str
    routing_schema: str = Field(alias="schema")
    type: str | None = None
    action_type: str | None = None
    action_payload: object = None
    filters: list[StreamFilter] | None = None
    landings: list[object] | None = None
    offers: list[StreamOffer]

    @model_validator(mode="after")
    def unique_offers(self) -> "Stream":
        if len({offer.offer_id for offer in self.offers}) != len(self.offers):
            raise ValueError("Duplicate offer IDs in a Keitaro stream.")
        return self

    @property
    def country_codes(self) -> list[str]:
        return list(
            dict.fromkeys(
                code
                for stream_filter in self.filters or []
                if stream_filter.name == "country"
                and stream_filter.mode == "accept"
                and isinstance(stream_filter.payload, list)
                for code in stream_filter.payload
                if isinstance(code, str)
            )
        )
