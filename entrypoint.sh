#!/bin/bash
exec deno run --allow-net --allow-run --allow-read --allow-write app.js "$@"