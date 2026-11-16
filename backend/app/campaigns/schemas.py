from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.keitaro.schemas import Campaign, NamedResource, ResourceId

CampaignName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
CountryCode = Annotated[str, StringConstraints(pattern=r"^[A-Z]{2}$")]


class CreateCampaign(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    name: CampaignName
    country_codes: list[CountryCode] = Field(min_length=1)
    offer_id: ResourceId
    group_id: ResourceId
    domain_id: ResourceId
    traffic_source_id: ResourceId

    @field_validator("country_codes")
    @classmethod
    def unique_countries(cls, codes: list[str]) -> list[str]:
        if len(set(codes)) != len(codes):
            raise ValueError("Country codes must be unique.")
        return codes


class CampaignListResponse(BaseModel):
    items: list[Campaign]
    page: int
    has_next: bool


class CampaignOptions(BaseModel):
    groups: list[NamedResource]
    domains: list[NamedResource]
    traffic_sources: list[NamedResource]
