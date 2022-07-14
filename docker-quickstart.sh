#!/bin/bash
port=${1:-3000}
name=${2:-default}
sh ./docker-build.sh &
sh ./docker-run.sh $port $name