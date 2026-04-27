from enum import StrEnum


class UserRole(StrEnum):
    CLIENT = "client"
    MANAGER = "manager"
    ADMIN = "admin"


class RequestStatus(StrEnum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    QUOTED = "quoted"
    DONE = "done"
    CANCELLED = "cancelled"


class RequestSource(StrEnum):
    CALCULATOR = "calculator"
    LIBRARY = "library"
