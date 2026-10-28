from __future__ import annotations

import ipaddress
import re
import socket
from urllib.parse import urlparse

from fastapi import HTTPException, UploadFile, status

# Allowed schemes
_ALLOWED_SCHEMES = {"http", "https"}

# Safe identifier pattern for files/IDs (prevents path traversal)
_SAFE_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")

# Maximum upload size: 50 MB
DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024


def validate_identifier(identifier: str, param_name: str = "ID") -> str:
    """Validates that an identifier contains only alphanumeric, hyphen and underscore characters."""
    clean = identifier.strip()
    if not _SAFE_ID_PATTERN.match(clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Geçersiz {param_name} formatı. "
                "Yalnızca harf, rakam, tire ve alt çizgi içerebilir."
            ),
        )
    return clean


def validate_external_url(url: str) -> str:
    """Protects against SSRF (Server-Side Request Forgery).

    Ensures URL uses HTTP/HTTPS and does not target loopback, private networks, or cloud metadata.
    """
    clean_url = url.strip()
    if not clean_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL boş olamaz.",
        )

    try:
        parsed = urlparse(clean_url)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz URL formatı.",
        ) from exc

    scheme = parsed.scheme.lower()
    if scheme not in _ALLOWED_SCHEMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Güvenlik nedeniyle yalnızca HTTP ve HTTPS protokolleri desteklenir. "
                f"(Alınan: {scheme})"
            ),
        )

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL'de geçerli bir sunucu adresi (host) bulunamadı.",
        )

    # Block well-known metadata hostnames and loopback names
    blocked_hosts = {"localhost", "127.0.0.1", "0.0.0.0", "metadata.google.internal"}
    if hostname.lower() in blocked_hosts or hostname.lower().endswith(".localhost"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Güvenlik kısıtlaması: Yerel sunucu veya iç ağ adreslerine erişim engellendi.",
        )

    # Resolve IP address to detect private/internal IP ranges
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        for entry in addr_info:
            ip_str = entry[4][0]
            ip_obj = ipaddress.ip_address(ip_str)

            # Block private, loopback, link-local, multicast, or reserved IPs
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_multicast
                or ip_obj.is_reserved
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Güvenlik kısıtlaması: "
                        "Özel iç ağ IP adreslerine (SSRF) erişim engellendi."
                    ),
                )
    except socket.gaierror as exc:
        # If domain cannot be resolved, let client know
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sunucu adı çözümlenemedi (DNS hatası): {hostname}",
        ) from exc

    return clean_url


async def read_upload_file_safely(
    file: UploadFile,
    max_bytes: int = DEFAULT_MAX_UPLOAD_BYTES,
    chunk_size: int = 64 * 1024,
) -> bytes:
    """Reads an uploaded file chunk-by-chunk and enforces maximum payload size in memory."""
    total_bytes = 0
    chunks: list[bytes] = []

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > max_bytes:
            max_mb = max_bytes // (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Dosya boyutu sınırı aşıldı. Maksimum izin verilen boyut: {max_mb} MB.",
            )
        chunks.append(chunk)

    return b"".join(chunks)
