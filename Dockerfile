# Stage 1
FROM golang:1.24.6-alpine AS builder
WORKDIR /app

COPY go.mod .
RUN go mod tidy

COPY . .

RUN go get
RUN go build -o app

# Stage 2
FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/app .
COPY static ./static

EXPOSE 8080
ENTRYPOINT ["./app"]
