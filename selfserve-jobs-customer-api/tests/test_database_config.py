from types import SimpleNamespace

from app import database


def test_postgres_engine_options_use_bounded_pool(monkeypatch):
    monkeypatch.setattr(
        database,
        "settings",
        SimpleNamespace(
            database_url="postgresql+asyncpg://user:pass@localhost/jobs4u",
            database_pool_size=1,
            database_max_overflow=1,
            database_pool_timeout_seconds=10,
            database_pool_recycle_seconds=1800,
            is_development=False,
        ),
    )

    options = database._build_engine_options()

    assert options["pool_size"] == 1
    assert options["max_overflow"] == 1
    assert options["pool_timeout"] == 10
    assert options["pool_recycle"] == 1800
    assert options["pool_pre_ping"] is True
    assert options["pool_use_lifo"] is True
    assert options["connect_args"] == {"server_settings": {"statement_timeout": "30000"}}


def test_sqlite_engine_options_skip_postgres_pool(monkeypatch):
    monkeypatch.setattr(
        database,
        "settings",
        SimpleNamespace(
            database_url="sqlite+aiosqlite:///:memory:",
            is_development=False,
        ),
    )

    options = database._build_engine_options()

    assert "pool_size" not in options
    assert "max_overflow" not in options
    assert "pool_timeout" not in options
    assert "pool_pre_ping" not in options
    assert options["connect_args"] == {}
