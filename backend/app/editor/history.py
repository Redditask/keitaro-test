from sqlalchemy import case, func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.database import KnownStreamOffer
from app.editor.schemas import OfferView, StreamView
from app.keitaro.schemas import Stream, StreamOffer


def save_stream_history(
    database: Session,
    stream: Stream,
    names: dict[int, str],
    *,
    observed: list[StreamOffer] | None = None,
    pins: dict[int, bool] | None = None,
) -> StreamView:
    present = {offer.offer_id for offer in stream.offers}
    active = {offer.offer_id for offer in stream.offers if offer.state == "active"}
    seen = present | {offer.offer_id for offer in observed or []}

    if seen:
        insert_offers = insert(KnownStreamOffer).values(
            [
                {
                    "stream_id": stream.id,
                    "offer_id": offer_id,
                    "last_known_name": names.get(offer_id),
                    "is_pinned": offer_id in active
                    and (pins or {}).get(offer_id, False),
                }
                for offer_id in sorted(seen)
            ]
        )
        database.execute(
            insert_offers.on_conflict_do_update(
                index_elements=[KnownStreamOffer.stream_id, KnownStreamOffer.offer_id],
                set_={
                    "last_known_name": func.coalesce(
                        insert_offers.excluded.last_known_name,
                        KnownStreamOffer.last_known_name,
                    ),
                    "is_pinned": (
                        case(
                            (
                                KnownStreamOffer.offer_id.in_(active),
                                KnownStreamOffer.is_pinned,
                            ),
                            else_=False,
                        )
                        if pins is None
                        else insert_offers.excluded.is_pinned
                    ),
                },
            )
        )

    database.execute(
        update(KnownStreamOffer)
        .where(
            KnownStreamOffer.stream_id == stream.id,
            KnownStreamOffer.offer_id.not_in(seen),
            KnownStreamOffer.is_pinned,
        )
        .values(is_pinned=False)
    )

    rows = database.scalars(
        select(KnownStreamOffer)
        .where(KnownStreamOffer.stream_id == stream.id)
        .order_by(KnownStreamOffer.offer_id)
    )
    history = {row.offer_id: row for row in rows}
    current = [
        OfferView(
            offer_id=offer.offer_id,
            name=history[offer.offer_id].last_known_name or f"Offer #{offer.offer_id}",
            state=offer.state,
            share=offer.share,
            is_pinned=history[offer.offer_id].is_pinned,
        )
        for offer in stream.offers
    ]
    removed = [
        OfferView(
            offer_id=offer_id,
            name=row.last_known_name or f"Offer #{offer_id}",
            state="removed",
            share=0,
            is_pinned=False,
        )
        for offer_id, row in history.items()
        if offer_id not in present
    ]

    return StreamView(
        id=stream.id,
        name=stream.name,
        position=stream.position,
        state=stream.state,
        routing_schema=stream.routing_schema,
        is_editable=stream.routing_schema == "landings",
        redirect_url=(
            stream.action_payload
            if stream.routing_schema == "redirect"
            and isinstance(stream.action_payload, str)
            else None
        ),
        country_codes=stream.country_codes,
        offers=current + removed,
    )
