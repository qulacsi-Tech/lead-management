from enum import Enum

class UserRole(str, Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    AGENT = "Agent"
    STUDENT = "Student"
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
