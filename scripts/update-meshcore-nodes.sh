#!/usr/bin/env bash
# Refresh the static MeshCore node snapshot used by /hhf/.
#
# The HHF dashboard loads this file first for an instant render, then
# tries to refresh from the live API. Re-run this occasionally (or before
# a deploy) so the cached fallback stays reasonably current.
#
# Usage: scripts/update-meshcore-nodes.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO_ROOT/src/assets/data/meshcore-nodes-cached.json"

# Region matches the defaults hardcoded into /hhf/ (center + radius).
CENTER_LAT=42.4
CENTER_LON=-71.25
RADIUS_KM=40

mkdir -p "$(dirname "$OUT")"

curl -sSf 'https://map.meshcore.io/api/v1/nodes' \
  | CENTER_LAT="$CENTER_LAT" CENTER_LON="$CENTER_LON" RADIUS_KM="$RADIUS_KM" \
    python3 -c '
import json, sys, math, datetime, os

CENTER = (float(os.environ["CENTER_LAT"]), float(os.environ["CENTER_LON"]))
RADIUS_KM = float(os.environ["RADIUS_KM"])

def hav_km(a, b):
    R = 6371
    dlat = math.radians(b[0]-a[0]); dlon = math.radians(b[1]-a[1])
    s = math.sin(dlat/2)**2 + math.cos(math.radians(a[0]))*math.cos(math.radians(b[0]))*math.sin(dlon/2)**2
    return 2*R*math.asin(math.sqrt(s))

data = json.load(sys.stdin)
kept = []
for n in data:
    lat = n.get("adv_lat"); lon = n.get("adv_lon")
    if not isinstance(lat,(int,float)) or not isinstance(lon,(int,float)): continue
    if hav_km(CENTER, (lat,lon)) > RADIUS_KM: continue
    pk = n.get("public_key"); name = n.get("adv_name")
    if not pk: continue
    kept.append({"public_key": pk, "adv_name": name, "adv_lat": lat, "adv_lon": lon})

out = {
    "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "source": "https://map.meshcore.io/api/v1/nodes",
    "region": {"center": list(CENTER), "radius_km": RADIUS_KM},
    "nodes": kept,
}
json.dump(out, sys.stdout, indent=2)
print(f"kept {len(kept)} of {len(data)} nodes", file=sys.stderr)
' > "$OUT"

echo "wrote $OUT"
