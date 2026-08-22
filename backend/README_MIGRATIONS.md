# Database migrations

Schema is owned by **Alembic** as of Phase 2. The application no longer creates
or alters tables at startup — `main.py` only checks that the schema is current
and fails fast with instructions if it isn't.

## Everyday use

```bash
cd backend
py migrate.py            # bring the database to head (safe on any state)
py migrate.py --status   # report state, change nothing
```

`migrate.py` detects which of three states the database is in and does the
right thing:

| State | What happens |
|---|---|
| Empty database | Upgrades from zero, creating every table |
| Existing pre-Alembic data | Stamps `0001` (the baseline already matches disk), then upgrades. **Nothing is recreated, no data is lost.** |
| Already under Alembic | Plain `upgrade head` |

Running bare `alembic upgrade head` on a pre-Alembic database would try to
`CREATE TABLE users` on a database that already has one. Use `migrate.py`.

## Creating a new migration

```bash
cd backend
py -m alembic revision --autogenerate -m "short description"
# review the generated file before committing — always
py migrate.py
```

Add any new model to `models/__init__.py`, or autogenerate will not see it.

## Revisions

| Revision | Contents |
|---|---|
| `0001` | Baseline — the pre-Phase-2 schema (`users`, `students`, `mentors`, `institutes`, `enquiries`, `enquiry_unlocks`, `revoked_tokens`), replacing the old `create_all` + 24 ad-hoc `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements |
| `0002` | Phase 2 — `pages`, `page_admins`, `courses`, `opportunities`, `page_enquiries`, `follows`, `notifications`, `credit_transactions`. Purely additive. |

## Tables Alembic deliberately ignores

The development database contains tables whose models were deleted in commit
`aa2e498`, some still holding rows:

```
leads  lead_activities  lead_tasks
papers  paper_questions  paper_attempts
job_postings  mentor_follows
```

`alembic/env.py` lists these in `LEGACY_UNMANAGED_TABLES` and excludes them from
autogenerate. Without that, every `--autogenerate` would propose `DROP TABLE`
for all eight and silently destroy data.

Four columns on `users` are excluded the same way — `qualification`,
`experience`, `current_institute`, `previous_institutes` — leftovers from an
earlier Professional Profile revision. They are nullable and harmless; a fresh
database simply never creates them.

**These exclusions are a holding position, not a decision.** Someone should
decide explicitly whether to drop them, and do it in a reviewed migration.

## Verified

- Fresh database → `upgrade head` → 16 tables, application starts
- Existing development database → stamp + upgrade → all rows intact
  (12 users, 2 students, 1 mentor, 2 institutes, 1 enquiry, 13 revoked tokens)
- `downgrade base` → `upgrade head` round-trips cleanly
