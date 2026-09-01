import pytest

from src.users.schemas import UserUpdateMeSchema


def test_update_me_schema_allows_no_password_fields() -> None:
    schema = UserUpdateMeSchema(full_name="שם חדש")
    assert schema.current_password is None
    assert schema.new_password is None


def test_update_me_schema_allows_both_password_fields() -> None:
    schema = UserUpdateMeSchema(current_password="old", new_password="new")
    assert schema.current_password == "old"
    assert schema.new_password == "new"


def test_update_me_schema_rejects_new_password_without_current() -> None:
    with pytest.raises(ValueError, match="current_password is required"):
        UserUpdateMeSchema(new_password="new")


def test_update_me_schema_rejects_current_password_without_new() -> None:
    with pytest.raises(ValueError, match="new_password is required"):
        UserUpdateMeSchema(current_password="old")
