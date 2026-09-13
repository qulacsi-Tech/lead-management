from enum import Enum

class EnquiryType(str, Enum):
    COACHING = "Coaching"
    COLLEGE = "College"

class UserRole(str, Enum):
    ADMIN = "Admin"
    PROFESSIONAL = "Professional"
    STUDENT = "Student"
    # Legacy roles, still referenced by Admin-provisioned accounts
    # (register.py's /register/mentor, /register/institute) — not part of
    # the current 2-role (Professional/Student) signup model.
    MANAGER = "Manager"
    AGENT = "Agent"
    MENTOR = "Mentor"
    INSTITUTE = "Institute"

class LeadStatus(str, Enum):
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    FOLLOW_UP = "FollowUp"
    INTERESTED = "Interested"
    NOT_INTERESTED = "NotInterested"
    CONVERTED = "Converted"
    LOST = "Lost"

class LeadSource(str, Enum):
    WEBSITE = "Website"
    REFERRAL = "Referral"
    SOCIAL_MEDIA = "SocialMedia"
    WALK_IN = "WalkIn"
    PHONE_INQUIRY = "PhoneInquiry"
    ADVERTISEMENT = "Advertisement"
    EVENT = "Event"
    OTHER = "Other"

class ActivityType(str, Enum):
    NOTE = "Note"
    CALL = "Call"
    EMAIL = "Email"
    MEETING = "Meeting"
    SMS = "SMS"
    STATUS_CHANGE = "StatusChange"

class TaskStatus(str, Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class TaskPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class AdVisibility(str, Enum):
    """Where an ad (admission notice, vacancy, guess paper) is allowed to run.

    PAGE is the default and matches how ads behaved before this existed: the
    item shows on its own institute's public page and in the feed, and nowhere
    else. PLATFORM additionally makes it eligible for the sponsored rail on
    *other* institutes' pages.

    It is a deliberate choice by a Main Admin, not a derived property — the
    platform is selling placement on pages the advertiser does not own, so
    nothing should opt an institute into that on its behalf.
    """

    PAGE = "page"
    PLATFORM = "platform"


AD_VISIBILITIES = [AdVisibility.PAGE.value, AdVisibility.PLATFORM.value]
