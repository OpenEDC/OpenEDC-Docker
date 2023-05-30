#!/bin/bash
while getopts 'wpdo' flag; do
  case $flag in
    w) w_in=true
    ;;
    p) p_in=true
    ;;
    d) d_in=-d
    ;;
    o) o_in=true
    ;;
    *) echo "Invalid option -${flag}"
    exit 1
    ;;
  esac
done

shift $(($OPTIND - 1))
port=${1:-3000}
name=${2:-default}

docker_compose_string="-f docker-compose.yml";

[ -z "${w_in}" ] || docker_compose_string="${docker_compose_string} -f docker-compose.nginx.yml";

[ -z "${p_in}" ] || docker_compose_string="${docker_compose_string} -f docker-compose.prod.yml";

echo ${docker_compose_string} 
PORT=${port} NAME=${name} docker-compose ${docker_compose_string} -p openedc-${port} up ${d_in} --build --remove-orphans

[ -z "${o_in}" ] || [ -z "${d_in}" ] ||
{
  url="http://localhost/$name";
  if [ -z "${w_in}" ]
  then
    url="http://localhost:$port"
  fi
  case "$OSTYPE" in
    solaris*) echo "SOLARIS" ;;
    darwin*)  echo "OSX" ;; 
    linux*)   xdg-open ${url} ;;
    bsd*)     echo "BSD" ;;
    msys*)    start ${url} ;;
    cygwin*)  start ${url} ;;
    *)        echo "unknown: $OSTYPE" ;;
  esac
}
