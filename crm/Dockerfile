FROM gradle:8.5-jdk21 AS build

WORKDIR /app

# Copy only dependency-related files first (for caching)
COPY build.gradle settings.gradle ./
COPY gradle gradle
COPY gradlew ./

# Ensure wrapper is executable inside the image (git may not preserve exec bit)
RUN chmod +x ./gradlew

# Download dependencies (this layer will be cached if build.gradle doesn't change)
RUN ./gradlew dependencies --no-daemon

# Now copy source code
COPY src src

# Build the application
RUN ./gradlew build -x test --no-daemon

# Gradle can produce multiple jars (bootJar + plain jar). Create a single app.jar to copy.
RUN set -eux; \
	ls -1 /app/build/libs/*.jar; \
	BOOT_JAR="$(ls -1 /app/build/libs/*.jar | grep -v -- '-plain\.jar$' | head -n 1)"; \
	cp "$BOOT_JAR" /app/app.jar

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/app.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
