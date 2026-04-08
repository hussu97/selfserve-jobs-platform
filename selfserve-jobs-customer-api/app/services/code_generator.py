import secrets
import string

from nanoid import generate


def generate_code(size: int = 12) -> str:
    """Generate a nanoid code for public identifiers."""
    alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return generate(alphabet, size)


def generate_token(length: int = 64) -> str:
    """Generate a secure random token for edit tokens."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_verification_code(length: int = 64) -> str:
    """Generate a secure verification code."""
    return secrets.token_urlsafe(length)[:length]
