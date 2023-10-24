FROM denoland/deno

WORKDIR /app

# Prefer not to run as root.
#USER deno

# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
#COPY deps.ts .
COPY . .
RUN deno cache app.js

# These steps will be re-run upon each file change in your working directory:
#ADD . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
#RUN deno cache main.ts

ARG port=3000
ARG name=default
ENV port=$port
ENV name=$name

# The port that your application listens to.
EXPOSE $port

RUN chmod a+x entrypoint.sh
#ENTRYPOINT ["sh", "-c", "deno run --allow-net --allow-read --allow-write --allow-run app.js"]
ENTRYPOINT ["./entrypoint.sh"]
CMD ["3000", "default"]