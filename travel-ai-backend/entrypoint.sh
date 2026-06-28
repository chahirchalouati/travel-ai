#!/bin/sh

# Render auto-injects DATABASE_URL as postgres://user:pass@host:port/db
# Spring Boot requires jdbc:postgresql://host:port/db format with separate credentials
if [ -n "$DATABASE_URL" ]; then
  # Convert postgres:// to jdbc:postgresql://
  JDBC_URL=$(echo "$DATABASE_URL" | sed 's|^postgres://|jdbc:postgresql://|;s|^postgresql://|jdbc:postgresql://|')

  # Extract and remove credentials from URL if embedded (user:pass@host -> host)
  USER=$(echo "$JDBC_URL" | sed -n 's|jdbc:postgresql://\([^:]*\):\([^@]*\)@.*|\1|p')
  PASS=$(echo "$JDBC_URL" | sed -n 's|jdbc:postgresql://\([^:]*\):\([^@]*\)@.*|\2|p')
  CLEAN_URL=$(echo "$JDBC_URL" | sed 's|jdbc:postgresql://[^@]*@|jdbc:postgresql://|')

  if [ -n "$USER" ]; then
    export SPRING_DATASOURCE_URL="$CLEAN_URL"
    export SPRING_DATASOURCE_USERNAME="$USER"
    export SPRING_DATASOURCE_PASSWORD="$PASS"
  else
    export SPRING_DATASOURCE_URL="$JDBC_URL"
  fi
fi

exec java -jar app.jar
