import base64
import hashlib
from cryptography.fernet import Fernet
from app.config import JWT_SECRET_KEY

def get_fernet() -> Fernet:
    """Generate a valid Fernet key deterministically from the application secret."""
    key_bytes = hashlib.sha256(JWT_SECRET_KEY.encode("utf-8")).digest()
    b64_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(b64_key)

def encrypt_secret(plaintext: str) -> str:
    """Encrypt a sensitive string (e.g. API key) using AES-256 (Fernet)."""
    if not plaintext:
        return ""
    f = get_fernet()
    return f.encrypt(plaintext.encode("utf-8")).decode("utf-8")

def decrypt_secret(ciphertext: str) -> str:
    """Decrypt a ciphertext back to plaintext. Falls back gracefully if already plaintext."""
    if not ciphertext:
        return ""
    try:
        f = get_fernet()
        return f.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except Exception:
        # If decryption fails (e.g. legacy plaintext key in dev), return as-is
        return ciphertext

def mask_secret(secret: str) -> str:
    """Return a masked representation of a sensitive key for safe frontend display."""
    if not secret:
        return ""
    if len(secret) <= 8:
        return "••••••••"
    return secret[:3] + "••••••••" + secret[-4:]

