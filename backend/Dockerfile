FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre
WORKDIR /app

# Install Python + rembg for background removal
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install rembg Pillow numpy onnxruntime && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/venv/bin:$PATH"

COPY --from=build /app/target/*.jar app.jar
COPY scripts/ ./scripts/

RUN mkdir -p uploads

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
