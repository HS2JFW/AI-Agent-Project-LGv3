import pytest
import io
from httpx import AsyncClient
from app.services.auth_service import create_access_token

def get_auth_header(username: str, role: str) -> dict:
    token = create_access_token(data={"sub": username, "role": role})
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_user_queue_upload_and_isolation(client: AsyncClient):
    # Two seeded users: builder01 (builder) and user01 (superadmin)
    user1_headers = get_auth_header("builder01", "builder")
    user2_headers = get_auth_header("user01", "superadmin")

    # Clean queues first
    await client.delete("/api/clear-pdf-queue", headers=user1_headers)
    await client.delete("/api/clear-pdf-queue", headers=user2_headers)

    # User 1 (builder01) uploads a PDF file
    file_content = b"%PDF-1.4 test user 1 pdf content"
    files = [("files", ("test_iso1.pdf", io.BytesIO(file_content), "application/pdf"))]
    resp = await client.post("/api/upload-pdf-queue", files=files, headers=user1_headers)
    assert resp.status_code == 200
    assert "test_iso1.pdf" in resp.json()["uploaded"]

    # User 1 lists queue: should see test_iso1.pdf
    resp_u1 = await client.get("/api/list-pdf-queue", headers=user1_headers)
    assert resp_u1.status_code == 200
    u1_files = [f["name"] for f in resp_u1.json()["files"]]
    assert "test_iso1.pdf" in u1_files

    # User 2 lists queue: should NOT see test_iso1.pdf (isolated!)
    resp_u2 = await client.get("/api/list-pdf-queue", headers=user2_headers)
    assert resp_u2.status_code == 200
    u2_files = [f["name"] for f in resp_u2.json()["files"]]
    assert "test_iso1.pdf" not in u2_files

@pytest.mark.asyncio
async def test_user_queue_clear_does_not_affect_others(client: AsyncClient):
    user1_headers = get_auth_header("builder01", "builder")
    user2_headers = get_auth_header("user01", "superadmin")

    # User 1 uploads a file
    f1 = [("files", ("test_keep.pdf", io.BytesIO(b"%PDF-1.4 keep file"), "application/pdf"))]
    await client.post("/api/upload-pdf-queue", files=f1, headers=user1_headers)

    # User 2 uploads a file
    f2 = [("files", ("test_delete.pdf", io.BytesIO(b"%PDF-1.4 delete file"), "application/pdf"))]
    resp2 = await client.post("/api/upload-pdf-queue", files=f2, headers=user2_headers)
    assert resp2.status_code == 200

    # User 2 clears their own queue
    clear_resp = await client.delete("/api/clear-pdf-queue", headers=user2_headers)
    assert clear_resp.status_code == 200

    # User 2's queue is now empty
    resp_u2 = await client.get("/api/list-pdf-queue", headers=user2_headers)
    u2_files = [f["name"] for f in resp_u2.json()["files"]]
    assert "test_delete.pdf" not in u2_files

    # User 1's file is STILL safe!
    resp_u1 = await client.get("/api/list-pdf-queue", headers=user1_headers)
    u1_files = [f["name"] for f in resp_u1.json()["files"]]
    assert "test_keep.pdf" in u1_files

@pytest.mark.asyncio
async def test_user_queue_download_and_single_delete(client: AsyncClient):
    user1_headers = get_auth_header("builder01", "builder")

    # User 1 uploads a file in this test
    f1 = [("files", ("single_del.pdf", io.BytesIO(b"%PDF-1.4 single file"), "application/pdf"))]
    up_resp = await client.post("/api/upload-pdf-queue", files=f1, headers=user1_headers)
    assert up_resp.status_code == 200

    # User 1 downloads the file
    get_resp = await client.get("/api/queue-pdf/single_del.pdf", headers=user1_headers)
    assert get_resp.status_code == 200
    assert b"%PDF-1.4 single file" in get_resp.content

    # User 1 deletes single file
    del_resp = await client.delete("/api/delete-pdf-queue?filename=single_del.pdf", headers=user1_headers)
    assert del_resp.status_code == 200

    # After delete, user 1 cannot find it
    get_again = await client.get("/api/queue-pdf/single_del.pdf", headers=user1_headers)
    assert get_again.status_code == 404

@pytest.mark.asyncio
async def test_viewer_role_blocked_from_queue_mutation(client: AsyncClient):
    viewer_headers = get_auth_header("viewer01", "viewer")

    # Viewer cannot upload
    files = [("files", ("blocked.pdf", io.BytesIO(b"test"), "application/pdf"))]
    resp = await client.post("/api/upload-pdf-queue", files=files, headers=viewer_headers)
    assert resp.status_code == 403

    # Viewer cannot clear
    resp_clear = await client.delete("/api/clear-pdf-queue", headers=viewer_headers)
    assert resp_clear.status_code == 403
