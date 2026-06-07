from src.core.security import (
    MAGIC_LOGIN_PURPOSE,
    create_access_token,
    create_magic_login_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)


def test_password_round_trip() -> None:
    hashed = hash_password("secret123")
    assert hashed != "secret123"
    assert verify_password("secret123", hashed)
    assert not verify_password("wrong", hashed)


def test_access_token_round_trip() -> None:
    token = create_access_token("user-123", org_id="org-abc", org_role="member")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["org_id"] == "org-abc"
    assert payload["org_role"] == "member"
    assert payload["sys_admin"] is False


def test_access_token_sys_admin_no_org() -> None:
    token = create_access_token("user-456", org_id=None, org_role=None, sys_admin=True)
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sys_admin"] is True
    assert "org_id" not in payload
    assert "org_role" not in payload


def test_decode_invalid_token_returns_none() -> None:
    assert decode_access_token("not-a-jwt") is None


def test_magic_login_token_carries_purpose_and_sub() -> None:
    token = create_magic_login_token("user-99")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user-99"
    assert payload["purpose"] == MAGIC_LOGIN_PURPOSE


def test_refresh_token_hashing_is_deterministic() -> None:
    raw = generate_refresh_token()
    assert len(raw) > 40
    assert hash_refresh_token(raw) == hash_refresh_token(raw)
