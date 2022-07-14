#!/bin/bash
while getopts ":p:n:" opt; do
  case $opt in
    p) p_in="$OPTARG"
    ;;
    n) n_in="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    exit 1
    ;;
  esac

  case $OPTARG in
    -*) echo "Option $opt needs a valid argument"
    exit 1
    ;;
  esac
done


port=${p_in:-3000}
name=${n_in:-default}
docker run -dp $port:$port openedc $port $name

case "$OSTYPE" in
  solaris*) echo "SOLARIS" ;;
  darwin*)  echo "OSX" ;; 
  linux*)   xdg-open http://localhost:$port ;;
  bsd*)     echo "BSD" ;;
  msys*)    start http://localhost:$port ;;
  cygwin*)  start http://localhost:$port ;;
  *)        echo "unknown: $OSTYPE" ;;
esac

