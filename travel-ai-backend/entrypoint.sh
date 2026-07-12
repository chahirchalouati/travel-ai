#!/bin/sh

# Parse DATABASE_URL (postgres://user:pass@host:port/db)
# Injected by Render, Fly.io postgres attach, or set manually (e.g. Supabase)
if [ -n "$DATABASE_URL" ]; then
  JDBC_URL=$(echo "$DATABASE_URL" | sed 's|^postgres://|jdbc:postgresql://|;s|^postgresql://|jdbc:postgresql://|')
  DB_USER=$(echo "$JDBC_URL" | sed -n 's|jdbc:postgresql://\([^:]*\):\([^@]*\)@.*|\1|p')
  DB_PASS=$(echo "$JDBC_URL" | sed -n 's|jdbc:postgresql://\([^:]*\):\([^@]*\)@.*|\2|p')
  CLEAN_URL=$(echo "$JDBC_URL" | sed 's|jdbc:postgresql://[^@]*@|jdbc:postgresql://|')

  if [ -n "$DB_USER" ]; then
    export SPRING_DATASOURCE_URL="$CLEAN_URL"
    export SPRING_DATASOURCE_USERNAME="$DB_USER"
    export SPRING_DATASOURCE_PASSWORD="$DB_PASS"
  else
    export SPRING_DATASOURCE_URL="$JDBC_URL"
  fi
fi

# Parse Redis URL — supports UPSTASH_REDIS_DATABASE_URL (Fly.io Upstash ext) or REDIS_URL
# Formats: redis://:pass@host:port  or  rediss://:pass@host:port (TLS)
REDIS_CONNECTION_URL="${UPSTASH_REDIS_DATABASE_URL:-$REDIS_URL}"
if [ -n "$REDIS_CONNECTION_URL" ]; then
  REDIS_PASS=$(echo "$REDIS_CONNECTION_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
  REDIS_HOST_PORT=$(echo "$REDIS_CONNECTION_URL" | sed -n 's|.*@\(.*\)|\1|p')
  REDIS_HOST_VAL=$(echo "$REDIS_HOST_PORT" | cut -d: -f1)
  REDIS_PORT_VAL=$(echo "$REDIS_HOST_PORT" | cut -d: -f2)

  export SPRING_DATA_REDIS_HOST="$REDIS_HOST_VAL"
  export SPRING_DATA_REDIS_PORT="${REDIS_PORT_VAL:-6379}"
  export SPRING_DATA_REDIS_PASSWORD="$REDIS_PASS"

  case "$REDIS_CONNECTION_URL" in
    rediss://*) export SPRING_DATA_REDIS_SSL_ENABLED="true" ;;
  esac
fi

exec java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar app.jar
