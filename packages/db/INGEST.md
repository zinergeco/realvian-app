# Running the ingest

Fetches real UK open data, computes national baselines from the fetched
data, scores every area, and writes to Postgres.

## On the server (Coolify terminal)

```bash
cd /tmp && rm -rf rv && git clone -q --depth 1 \
  https://github.com/zinergeco/realvian-app.git rv

# 1. Dry run — writes nothing, prints the SQL it would run
docker run --rm --network coolify \
  -v /tmp/rv/packages/db/src/ingest-run.mjs:/app/i.mjs \
  node:22-alpine node /app/i.mjs > /tmp/ingest.sql

# Inspect what came back
head -40 /tmp/ingest.sql
grep -c INSERT /tmp/ingest.sql

# 2. Apply it
DB=$(docker ps -qf name=ymg5 | head -1)
docker cp /tmp/ingest.sql $DB:/tmp/i.sql
docker exec $DB psql -U postgres -d realvian -f /tmp/i.sql
```

## What it fetches

| Source | Licence | Gives us |
|---|---|---|
| postcodes.io (ONS-derived) | OGL v3 | Coordinates, admin district, region |
| Overpass / OpenStreetMap | ODbL | Amenity counts, nearest park, transport |

Takes roughly 5 minutes for 38 outcodes — Overpass is rate-limited to
one request per 2.5s deliberately, because it's a free shared service.

## What it does NOT fetch yet

- **HM Land Registry prices** — the SPARQL endpoint is slow enough to
  need its own scheduled run
- **Police.uk crime** — needs population figures to rate-adjust, which
  we don't hold yet

Both are additive. The schema already has the columns.

## Important: scores will be PARTIAL

Only 3 of 6 dimensions are available this pass, so `score_confidence`
will be around 0.50. Under the scoring engine's own rules that is below
the 0.60 publication threshold — so these scores should be treated as
provisional until prices and crime are wired in.

The baselines are computed **from the fetched data**, not from the
estimated constants in `scoring.ts`. That fixes the miscalibrated crime
percentiles noted when the engine was first written.
