from collections.abc import Iterable

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.editor.history import save_stream_history
from app.editor.schemas import PublishOffers, StreamView
from app.errors import ApiError
from app.keitaro.client import KeitaroClient
from app.keitaro.schemas import Offer, OfferState, Resource, Stream, StreamOffer


def publish_offers(
    campaign_id: int,
    stream_id: int,
    data: PublishOffers,
    keitaro: KeitaroClient,
    database: Session,
) -> StreamView:
    stream_path = f"streams/{stream_id}"
    before = editable_stream(keitaro, stream_path, campaign_id, stream_id)
    catalog = {
        offer.id: offer for offer in keitaro.request("GET", "offers", list[Offer])
    }
    before_states = {offer.offer_id: offer.state for offer in before.offers}

    for offer in data.offers:
        known_state = before_states.get(offer.offer_id)
        catalog_offer = catalog.get(offer.offer_id)
        if (
            known_state is None
            or (known_state == "disabled" and offer.state == "active")
        ) and (catalog_offer is None or catalog_offer.state != "active"):
            raise ApiError(
                422,
                "offer_unavailable",
                f"Offer #{offer.offer_id} is unavailable for this stream.",
                {"offer_id": offer.offer_id},
            )

    expected = distribution(data.offers)
    confirmed = before
    if distribution(before.offers) != expected:
        try:
            keitaro.request(
                "PUT",
                stream_path,
                Resource,
                payload={
                    "offers": [
                        offer.model_dump(exclude={"is_pinned"}) for offer in data.offers
                    ]
                },
            )
        except ApiError as error:
            if error.code == "keitaro_rejected":
                raise
            raise publication_unconfirmed() from None

        try:
            confirmed = editable_stream(keitaro, stream_path, campaign_id, stream_id)
        except ApiError:
            raise publication_unconfirmed() from None
        if distribution(confirmed.offers) != expected:
            raise publication_unconfirmed()

    try:
        with database.begin():
            view = save_stream_history(
                database,
                confirmed,
                {offer.id: offer.name for offer in catalog.values()},
                observed=before.offers,
                pins={offer.offer_id: offer.is_pinned for offer in data.offers},
            )
    except SQLAlchemyError:
        raise publication_unconfirmed() from None
    return view


def editable_stream(
    keitaro: KeitaroClient, path: str, campaign_id: int, stream_id: int
) -> Stream:
    try:
        stream = keitaro.request("GET", path, Stream)
    except ApiError as error:
        if error.status == 404:
            raise ApiError(
                409, "stream_changed", "The stream is no longer available in Keitaro."
            ) from None
        raise
    if stream.id != stream_id or stream.campaign_id != campaign_id:
        raise ApiError(
            409, "stream_changed", "The stream no longer belongs to this campaign."
        )
    if stream.routing_schema != "landings":
        raise ApiError(
            409,
            "stream_changed",
            "This stream does not support offer editing.",
        )
    return stream


def distribution(offers: Iterable[StreamOffer]) -> dict[int, tuple[OfferState, int]]:
    return {offer.offer_id: (offer.state, offer.share) for offer in offers}


def publication_unconfirmed() -> ApiError:
    return ApiError(
        502,
        "publication_unconfirmed",
        "Publication is unconfirmed. Select Publish again to check the result in Keitaro.",
    )
