# Instrumentation reference

Supporting detail for `devrel-metrics-plan`. Paraphrased from *How to Build Developer Ecosystems* by Amir Shevat and Marcos Placona, Appendix I. Use this as written; only change table or column names if the team gives you their actual warehouse schema.

## Naming convention

Name events `noun_verb`: the thing that happened, then what happened to it. For example, `quickstart_completed` for a finished quickstart, or `activation_event_fired` for the moment a developer's action counts as real activation. Version an event's name (`_v2` and so on) when its shape changes, rather than silently changing the fields under the same name.

## Required fields

Every event needs:

- `event_name`: the noun_verb name
- `user_id`: who triggered it
- `timestamp`: when it happened, in UTC
- `session_id`: which session it belongs to

Optional but useful: `environment` (sandbox or production), `sdk_version`, `language`, `framework`.

## Never sample activation events

Apply sampling only to high-volume, low-value events, such as health checks. Never sample an activation event: losing even a fraction of them corrupts the activation rate, which is usually the first number leadership asks about. When sampling anything else, use consistent hashing so the same user is always included, or always excluded, rather than flipping between runs.

## Minimal event schema

One example establishes the pattern; the team's own events will vary in name and payload.

```json
{
  "event_name": "activation_event_fired",
  "user_id": "<user id>",
  "timestamp": "<ISO 8601 UTC>",
  "session_id": "<session id>",
  "environment": "production"
}
```

## Starter SQL

Written generically. Swap `signups` and `activation_events` for the team's own table names. Both queries assume one row per user in a signups table with a `signed_up_at` column, and one row per event in an events table with `user_id`, `event_name` and `occurred_at` columns.

**Time to first activation (median, in hours):**

```sql
WITH first_activation AS (
  SELECT
    user_id,
    MIN(occurred_at) AS activated_at
  FROM activation_events
  WHERE event_name = 'activation_event_fired'
  GROUP BY user_id
)
SELECT
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (fa.activated_at - s.signed_up_at)) / 3600
  ) AS median_hours_to_activation
FROM signups s
JOIN first_activation fa ON fa.user_id = s.user_id;
```

**7-day activation rate:**

```sql
WITH cohort AS (
  SELECT user_id, signed_up_at
  FROM signups
  WHERE signed_up_at >= CURRENT_DATE - INTERVAL '30 days'
),
activated_within_7d AS (
  SELECT DISTINCT e.user_id
  FROM activation_events e
  JOIN cohort c ON c.user_id = e.user_id
  WHERE e.event_name = 'activation_event_fired'
    AND e.occurred_at <= c.signed_up_at + INTERVAL '7 days'
)
SELECT
  ROUND(
    100.0 * COUNT(DISTINCT a.user_id) / COUNT(DISTINCT c.user_id),
    1
  ) AS activation_rate_pct
FROM cohort c
LEFT JOIN activated_within_7d a ON a.user_id = c.user_id;
```

Both queries are starting points, not certified benchmarks. Adjust the activation event name, the cohort window and the join conditions to match how the team actually defines activation.
