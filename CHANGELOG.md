# Changelog

## [Unreleased]

### Fixed
- Recruiter registration crash: removed spurious `email` keyword argument from `create_verification()` call in `recruiters.py` — caused a `TypeError` on every POST `/api/v1/recruiters/register` request in production
