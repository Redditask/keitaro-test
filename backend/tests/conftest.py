import os
from collections.abc import Iterator
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, create_engine
from sqlalchemy.schema import CreateSchema, DropSchema

from app.database import database_url


@pytest.fixture(scope="module")
def migrated_database() -> Iterator[Engine]:
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("Set TEST_DATABASE_URL to run PostgreSQL integration tests.")

    schema = f"relay_test_{uuid4().hex}"
    admin = create_engine(database_url(url))
    database = create_engine(
        database_url(url), connect_args={"options": f"-csearch_path={schema}"}
    )
    try:
        with admin.begin() as connection:
            connection.execute(CreateSchema(schema))
        with database.connect() as connection:
            config = Config(Path(__file__).resolve().parents[1] / "alembic.ini")
            config.attributes["connection"] = connection
            command.upgrade(config, "head")
        yield database
    finally:
        database.dispose()
        with admin.begin() as connection:
            connection.execute(DropSchema(schema, cascade=True, if_exists=True))
        admin.dispose()
