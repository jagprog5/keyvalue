FROM rust:1.61 AS builder
COPY . .
RUN cargo build --release 

FROM debian:bullseye
COPY --from=builder ./target/release/backend ./target/release/backend
RUN ls
CMD /target/release/backend
