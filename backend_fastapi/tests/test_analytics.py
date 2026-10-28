import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_duckdb_query_direct(client: AsyncClient, auth_headers: dict):
    payload = {
        "query": "SELECT 100 as total_count, 'analytics_ok' as status",
        "parquet_path": None
    }
    response = await client.post("/api/analytics/duckdb-query", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["rows"]) == 1
    assert data["rows"][0]["total_count"] == 100
    assert data["rows"][0]["status"] == "analytics_ok"

@pytest.mark.asyncio
async def test_auto_team_planner(client: AsyncClient, auth_headers: dict):
    payload = {
        "catalog": [
            {"table_name": "tor_requirements", "columns": ["id", "title", "budget"]}
        ],
        "objective": "Audit procurement budget compliance against government threshold"
    }
    response = await client.post("/api/analytics/auto-team-planner", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "suggested_agents" in data
    assert len(data["suggested_agents"]) > 0
