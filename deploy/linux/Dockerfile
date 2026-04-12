FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc gdb libc6-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY portable/ /app/

ENV MICRO_DRILLS_HOST=0.0.0.0
ENV MICRO_DRILLS_PORT=19081
ENV MICRO_DRILLS_NO_BROWSER=1

EXPOSE 19081
CMD ["python3", "debug_server.py"]
