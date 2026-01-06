FROM gradle:8.5-jdk21 AS build

WORKDIR /app

# Copy only dependency-related files first (for caching)
COPY build.gradle settings.gradle ./
COPY gradle gradle
COPY gradlew ./

# Download dependencies (this layer will be cached if build.gradle doesn't change)
RUN ./gradlew dependencies --no-daemon

# Now copy source code
COPY src src

# Build the application
RUN ./gradlew build -x test --no-daemon

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
