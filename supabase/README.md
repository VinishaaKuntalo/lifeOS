# Supabase Schema

The baseline schema lives in [migrations/20260406221500_initial_schema.sql](/Users/vinishaareddy/Desktop/lifeOS/supabase/migrations/20260406221500_initial_schema.sql).

It includes:

- normalized domain tables for auth profile, habits, tasks, goals, journal, health, and finance
- `created_at`, `updated_at`, and `deleted_at` columns on every table
- `user_id` ownership on every table
- RLS policies for per-user isolation
- indexes optimized around `user_id` and date-based retrieval
- automatic profile creation on signup through an `auth.users` trigger
