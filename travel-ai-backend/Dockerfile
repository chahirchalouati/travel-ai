# Stage 1: Build (context is repo root)
FROM eclipse-temurin:21-jdk-alpine AS builder
RUN apk add --no-cache nodejs npm
WORKDIR /app

# Copy Angular frontend source
COPY web-app ./web-app

# Copy backend source (preserving relative path ../web-app for Maven)
COPY travel-ai-backend/mvnw ./travel-ai-backend/
COPY travel-ai-backend/.mvn ./travel-ai-backend/.mvn
COPY travel-ai-backend/pom.xml ./travel-ai-backend/
RUN cd travel-ai-backend && ./mvnw dependency:go-offline -q

COPY travel-ai-backend/src ./travel-ai-backend/src
RUN cd travel-ai-backend && ./mvnw package -DskipTests -q

# Stage 2: Run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/travel-ai-backend/target/travel-ai-backend-*.jar app.jar
COPY travel-ai-backend/entrypoint.sh entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
