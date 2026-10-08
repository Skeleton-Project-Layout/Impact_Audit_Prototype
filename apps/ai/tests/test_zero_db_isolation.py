import os
import sys


def test_zero_db_credentials_in_environment():
    """Assert AI microservice has ZERO database credentials in its environment."""
    forbidden_env_keys = [
        "DATABASE_URL", "POSTGRES_USER", "POSTGRES_PASSWORD",
        "POSTGRES_DB", "SPRING_DATASOURCE_URL", "SPRING_DATASOURCE_PASSWORD"
    ]
    for key in forbidden_env_keys:
        assert key not in os.environ, f"Architectural violation: Forbidden DB key '{key}' found in AI environment!"


def test_zero_db_drivers_imported():
    """Assert AI microservice does NOT import or depend on SQL/PostgreSQL drivers."""
    forbidden_modules = ["psycopg2", "asyncpg", "sqlalchemy", "tortoise", "peewee", "pg8000"]
    for mod in forbidden_modules:
        assert mod not in sys.modules, f"Architectural violation: DB driver '{mod}' imported in AI service!"


def test_zero_write_path_to_scoring():
    """Assert AI microservice output schema contains zero mutable score fields."""
    from app.models import SummariseRunResponse
    response_fields = SummariseRunResponse.model_fields.keys()
    forbidden_score_mutations = ["new_acs_score", "score_override", "updated_band", "recalculated_score"]
    for field in forbidden_score_mutations:
        assert field not in response_fields, f"Architectural violation: AI output attempted to expose score field '{field}'!"
