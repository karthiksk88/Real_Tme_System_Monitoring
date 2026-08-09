# Multi-stage Docker build for NeuroSys Spring Boot Backend

# Stage 1: Build JAR with Maven and OpenJDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy repository source code
COPY . .

# Package neurosys-backend skipping tests
RUN mvn clean package -DskipTests -f neurosys-backend/pom.xml

# Stage 2: Minimal Runtime Container
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy compiled JAR from build stage
COPY --from=build /app/neurosys-backend/target/neurosys-backend-1.0.0-SNAPSHOT.jar app.jar

# Expose Spring Boot port
EXPOSE 8080

# Run Spring Boot application with dynamic Railway PORT binding
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
