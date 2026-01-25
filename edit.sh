#!/bin/bash
cd "$(dirname "$0")"

# Open browser after a short delay (gives server time to start)
(sleep 1 && xdg-open http://localhost:3001) &

node edit-server.js
