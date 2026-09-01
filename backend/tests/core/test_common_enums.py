from src.core.enums.common_enums import SortOrder


def test_sort_order_values() -> None:
    assert SortOrder.asc.value == "asc"
    assert SortOrder.desc.value == "desc"


def test_sort_order_is_string_enum() -> None:
    assert SortOrder.asc == "asc"
