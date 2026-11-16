from alembic import context
from alembic.util import CommandError
from sqlalchemy import Connection, create_engine
from sqlalchemy.pool import NullPool

from app.database import Base, database_url
from app.settings import Settings


def migrate(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations() -> None:
    if context.is_offline_mode():
        context.configure(dialect_name="postgresql", literal_binds=True)
        with context.begin_transaction():
            context.run_migrations()
        return

    connection = context.config.attributes.get("connection")
    if connection is not None:
        migrate(connection)
        return

    url = Settings().database_url
    if url is None:
        raise CommandError("Set DATABASE_URL before running migrations.")
    engine = create_engine(database_url(url.get_secret_value()), poolclass=NullPool)
    try:
        with engine.connect() as connection:
            migrate(connection)
    finally:
        engine.dispose()


run_migrations()
