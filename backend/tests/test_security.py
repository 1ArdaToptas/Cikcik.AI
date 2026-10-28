import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.security import validate_external_url, validate_identifier
from app.main import app


def test_ssrf_protection_blocks_internal_and_private_ips():
    # Loopback & Localhost
    with pytest.raises(HTTPException) as exc:
        validate_external_url("http://127.0.0.1:8000/api/health")
    assert exc.value.status_code == 400

    with pytest.raises(HTTPException) as exc:
        validate_external_url("http://localhost:8000/api/health")
    assert exc.value.status_code == 400

    # Cloud metadata IP
    with pytest.raises(HTTPException) as exc:
        validate_external_url("http://169.254.169.254/latest/meta-data/")
    assert exc.value.status_code == 400

    # Arbitrary dangerous schemes
    with pytest.raises(HTTPException) as exc:
        validate_external_url("file:///etc/passwd")
    assert exc.value.status_code == 400

    with pytest.raises(HTTPException) as exc:
        validate_external_url("gopher://127.0.0.1:25")
    assert exc.value.status_code == 400


def test_path_traversal_identifier_validation():
    # Valid safe IDs
    assert validate_identifier("custom_12345678") == "custom_12345678"
    assert validate_identifier("voice-model_v1") == "voice-model_v1"

    # Malicious path traversal attempts
    with pytest.raises(HTTPException) as exc:
        validate_identifier("../../etc/passwd")
    assert exc.value.status_code == 400

    with pytest.raises(HTTPException) as exc:
        validate_identifier("..\\windows\\system32")
    assert exc.value.status_code == 400

    with pytest.raises(HTTPException) as exc:
        validate_identifier("id with spaces")
    assert exc.value.status_code == 400


def test_security_headers_middleware():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "default-src" in response.headers.get("Content-Security-Policy", "")
    assert response.headers.get("Permissions-Policy") == "camera=(), microphone=(self), geolocation=()"
