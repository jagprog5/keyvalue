# built in container using glibc 2.36
# everything else is statically linked (though rusqlite -> sqlite lib also relies on glibc)
FROM rust:1.77.0-bookworm AS builder
COPY . .
RUN cargo build --release

# also uses glibc 2.36 (dyn link)
FROM debian:12.5-slim
COPY --from=builder ./target/release/backend /target/release/backend
# healthcheck requires wget
RUN  apt-get update \
  && apt-get install -y wget \
  && rm -rf /var/lib/apt/lists/*
HEALTHCHECK --interval=900s CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/health || exit 1
CMD /target/release/backend
