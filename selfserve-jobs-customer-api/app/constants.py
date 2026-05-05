# ---------------------------------------------------------------------------
# Business-rule constants
#
# All tunable business rules live here so there is a single source of truth.
# Services and schemas must import from this module — never define these
# values inline or in individual service files.
# ---------------------------------------------------------------------------

# Job listings
JOB_EXPIRY_DAYS: int = 60
MAX_ACTIVE_JOBS_PER_EMAIL: int = 5

# Profile listings
PROFILE_EXPIRY_DAYS: int = 180
MAX_ACTIVE_PROFILES_PER_EMAIL: int = 2

# Auth / login tokens
SESSION_EXPIRY_DAYS: int = 30
LOGIN_TOKEN_EXPIRY_MINUTES: int = 15
LOGIN_RATE_LIMIT_PER_HOUR: int = 5

# Pagination
MAX_PAGE: int = 200  # Cap OFFSET-based pagination to prevent expensive full-table scans

# Verification
VERIFICATION_EXPIRY_HOURS: int = 24
RESEND_LIMIT_PER_ENTITY: int = 3
ADMIN_VERIFICATION_RESEND_COOLDOWN_HOURS: int = 1

# Reporting
REPORT_THRESHOLD: int = 3  # auto-flag entity for review after this many reports

# Renewal
MAX_RENEWALS: int = 2  # maximum number of times a listing can be renewed
RENEWAL_EXTENSION_DAYS: int = 60  # each renewal extends expires_at by this many days
