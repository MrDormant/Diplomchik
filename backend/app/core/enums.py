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


class ObjectType(StrEnum):
    WAREHOUSE = "warehouse"
    PRODUCTION = "production"
    TECHNICAL = "technical"


class FrameType(StrEnum):
    LSTK = "lstk"
    STEEL = "steel"
    MIXED = "mixed"


class CostUnit(StrEnum):
    SQM = "м²"
    PIECE = "шт"
    METER = "м"
    TON = "т"