FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre
WORKDIR /app

# Python + rembg for background removal
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv curl && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install rembg Pillow "numpy<2.0" onnxruntime scipy && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/venv/bin:$PATH"
ENV SPRING_PROFILES_ACTIVE=prod

COPY --from=build /app/target/*.jar app.jar
COPY scripts/ ./scripts/

# Non-root foydalanuvchi (xavfsizlik) + uploads katalogi egaligi.
# Named volume birinchi mount'da shu egalik/ruxsatni meros qiladi, shuning uchun appuser yoza oladi.
RUN useradd -r -u 1001 appuser && mkdir -p uploads && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
# Konteyner o'z sog'lig'ini bildiradi (Coolify/orkestrator qayta ishga tushirish qarorlari uchun).
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
