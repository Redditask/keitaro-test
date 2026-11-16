from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import URL, BigInteger, Engine, create_engine, make_url
from sqlalchemy.exc import ArgumentError, SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

from app.errors import ApiError


class Base(DeclarativeBase):
    pass


class KnownStreamOffer(Base):
    __tablename__ = "known_stream_offers"

    stream_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    offer_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    last_known_name: Mapped[str | None]
    is_pinned: Mapped[bool]


def database_url(value: str) -> URL:
    try:
        url = make_url(value)
    except ArgumentError:
        raise ArgumentError("Invalid DATABASE_URL.") from None
    if url.drivername == "postgresql":
        url = url.set(drivername="postgresql+psycopg")
    if url.drivername != "postgresql+psycopg":
        raise ArgumentError("Use a PostgreSQL URL for DATABASE_URL.")
    return url


def database_engine(value: str) -> Engine:
    return create_engine(database_url(value), pool_pre_ping=True, hide_parameters=True)


def get_session(request: Request) -> Iterator[Session]:
    engine: Engine | None = request.app.state.database
    if engine is None:
        raise ApiError(503, "database_unavailable", "PostgreSQL is unavailable.")
    with Session(engine) as session:
        try:
            yield session
        except SQLAlchemyError:
            raise ApiError(
                503, "database_unavailable", "PostgreSQL is unavailable."
            ) from None


Database = Annotated[Session, Depends(get_session)]
