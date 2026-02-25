# Changelog

All notable changes to this project will be documented in this file.

Format: [Date] - [Version] - [Type]

---

## [Unreleased]

---

## [0.3.0] - 2026-02-21

### Added
- Auth flows using Supabase Email/Password and `login.html`.
- Implemented RLS and `profiles` table for role-based access.
- Finance tab for invoice tracking.
- AWS S3 upload logic (`@aws-sdk/client-s3`, `multer`) for invoices.
- Settings UI for n8n API and AWS configurations.
- Integrated n8n webhook triggering on invoice upload.

### Changed
- Rebranded Godown to Joyspoon globally.
- Modified `/api/settings` UI to store secure API config.

---

## [0.1.0] - 2026-02-21

### Added
- Project initialization.
- Productivity tracking, sales syncing, and basic expenses modules.
- Created `AI_CONTEXT.md` and `CHANGELOG.md`.

### Technical Details
- Added basic file structure (HTML, Vanilla CSS, JS).
- Integrated Supabase.
