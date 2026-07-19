# Coach Library Architecture

The coach Library is split into four product domains while keeping the existing player program and diet delivery tables intact.

## Training catalog

- Exercises remain in `exercise_library` and now support lifecycle, sharing, tags, modality, measurement mode, revisions, and soft deletion.
- `workout_sections` group ordered exercise prescriptions using standard, interval, AMRAP, timed, or freestyle formats.
- Workouts and programs retain their existing tables and gain lifecycle, sharing, revisions, and soft deletion.
- Publishing records immutable JSON snapshots in `catalog_revisions`.
- Program assignment creates a `program_deliveries` snapshot before materializing the existing player schedule.

## Engagement and tracking

- `coaching_tasks` supports general, progress-photo, body-metric, and form tasks.
- `coach_forms`, `form_questions`, `form_responses`, and `form_answers` provide reusable questionnaires and player responses.
- `measurements`, `measurement_groups`, and `measurement_observations` provide reusable tracking definitions and dated values.
- `scheduled_coaching_items` delivers tasks, forms, and metric groups to a player calendar.

## Nutrition

- `food_items` stores normalized ingredient and nutrition values.
- `dishes` and `dish_components` build recipes from ingredients.
- `dish_collections` builds reusable recipe books.
- `menu_templates` and `menu_entries` provide multi-week meal-plan templates.

## Collaboration and safety

- Private assets are owner-only. Workspace assets are readable by active head coaches on the owner’s team.
- Coaches retain write control over their own catalog. Existing player/team RLS remains authoritative.
- Archive actions are soft deletes. Existing deliveries retain their revision snapshots.
- `library_audit_events` records catalog inserts, updates, deletes, publications, archives, and assignments.
- Follow-mode delivery records an update channel, but active assignments are not silently mutated. A reviewed diff workflow should approve future changes.

## Deployment

Apply `supabase/migrations/0048_coach_library_platform.sql` and then `0049_training_blueprint_builder.sql` before deploying the updated web client. The new Library routes and workout builder query tables and functions introduced by those migrations.

Migration `0049` adds atomic workout-blueprint saves, safe duplication, advanced exercise prescriptions, and delivery-compatible expansion of reusable sections.

After applying the migration, regenerate the Supabase TypeScript definitions with:

```powershell
npm run db:types
```

The current API module contains explicit interim interfaces so the web build remains type-safe before hosted type regeneration.
