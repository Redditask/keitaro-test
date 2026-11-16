from fastapi import APIRouter

from app.database import Database
from app.editor import publication, synchronization
from app.editor.schemas import CampaignEditor, PublishOffers, StreamView
from app.keitaro.client import Keitaro
from app.keitaro.schemas import ResourceId

router = APIRouter(prefix="/api/campaigns/{campaign_id}", tags=["editor"])


@router.post("/sync")
def sync_campaign(
    campaign_id: ResourceId, keitaro: Keitaro, database: Database
) -> CampaignEditor:
    return synchronization.sync_campaign(campaign_id, keitaro, database)


@router.put("/streams/{stream_id}/offers")
def publish_stream_offers(
    campaign_id: ResourceId,
    stream_id: ResourceId,
    data: PublishOffers,
    keitaro: Keitaro,
    database: Database,
) -> StreamView:
    return publication.publish_offers(campaign_id, stream_id, data, keitaro, database)
