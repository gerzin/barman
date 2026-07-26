# Build stage
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Cache dependencies separately from source changes
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /out/server ./cmd/api

# Runtime stage
FROM alpine:latest

RUN apk add --no-cache ca-certificates

COPY --from=builder /out/server /app/server

EXPOSE 8080

CMD ["/app/server"]
