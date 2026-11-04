"""Shared by the backends."""


class Upstream(Exception):
    def __init__(self, status, text):
        super().__init__(text)
        self.status, self.text = status, text


def check_path(value):
    if not isinstance(value, str) or not value.startswith("/") or ".." in value or "\0" in value:
        raise Upstream(400, "bad path")
    return value


