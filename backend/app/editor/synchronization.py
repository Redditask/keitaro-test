from sqlalchemy.orm import Session

from app.editor.history import save_stream_history
from app.editor.schemas import CampaignEditor
from app.errors import ApiError
from app.keitaro.client import KeitaroClient
from app.keitaro.schemas import Campaign, Offer, Stream


def sync_campaign(
    campaign_id: int, keitaro: KeitaroClient, database: Session
) -> CampaignEditor:
    campaign = keitaro.request("GET", f"campaigns/{campaign_id}", Campaign)
    streams = keitaro.request("GET", f"campaigns/{campaign_id}/streams", list[Stream])
    if (
        campaign.id != campaign_id
        or any(stream.campaign_id != campaign_id for stream in streams)
        or len({stream.id for stream in streams}) != len(streams)
    ):
        raise ApiError(
            502,
            "keitaro_response_invalid",
            "Keitaro returned an invalid stream list.",
        )

    names = {}
    if any(stream.offers for stream in streams):
        names = {
            offer.id: offer.name
            for offer in keitaro.request("GET", "offers", list[Offer])
        }

    with database.begin():
        views = [
            save_stream_history(database, stream, names)
            for stream in sorted(
                streams, key=lambda stream: (stream.position, stream.id)
            )
        ]
    return CampaignEditor(campaign=campaign, streams=views)
