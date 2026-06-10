# --- Build stage ---
# Multi-stage build: compile in golang image, ship a tiny alpine image.
# This drops the final image from ~900MB (golang base) to ~20MB.
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy module files first so layer cache survives source changes.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO_ENABLED=0 produces a statically linked binary that runs on alpine
# without glibc. -ldflags="-s -w" strips debug info to shrink the binary.
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o planpal-backend .

# --- Runtime stage ---
FROM alpine:3.20

# tzdata needed for time.LoadLocation("Asia/Tokyo") — the JST anchor we use
# for all-day events and AI free-slot suggestions (issue #4, calendar.go).
# ca-certificates needed for outbound HTTPS to Google and Gemini.
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/planpal-backend .

# Railway injects $PORT at runtime. main.go already honors os.Getenv("PORT")
# with 8080 as the local-dev fallback.
EXPOSE 8080

CMD ["./planpal-backend"]
