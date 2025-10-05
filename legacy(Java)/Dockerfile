# Stage 1
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn
COPY src src

RUN chmod +x mvnw && ./mvnw clean package -DskipTests

# Stage 2
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
