from alembic import op
from sqlalchemy import BigInteger, Boolean, Column, String

revision = "0001_known_stream_offers"
down_revision = None


def upgrade() -> None:
    op.create_table(
        "known_stream_offers",
        Column("stream_id", BigInteger, primary_key=True),
        Column("offer_id", BigInteger, primary_key=True),
        Column("last_known_name", String),
        Column("is_pinned", Boolean, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("known_stream_offers")
