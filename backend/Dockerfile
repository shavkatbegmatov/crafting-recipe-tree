FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre
WORKDIR /app

# Faqat HEALTHCHECK uchun curl. Rasm fonini o'chirish endi alohida servisda
# (services/rembg) — ilgari shu yerda o'rnatilgan Python ML steki (onnxruntime,
# scipy, numpy) image'ni ~1.5 GB ga shishirardi va har bir deploy'ni sekinlashtirardi.
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV SPRING_PROFILES_ACTIVE=prod

COPY --from=build /app/target/*.jar app.jar

# Non-root foydalanuvchi (xavfsizlik) + uploads katalogi egaligi.
# Named volume birinchi mount'da shu egalik/ruxsatni meros qiladi, shuning uchun appuser yoza oladi.
RUN useradd -r -u 1001 appuser && mkdir -p uploads && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
# Konteyner o'z sog'lig'ini bildiradi (Coolify/orkestrator qayta ishga tushirish qarorlari uchun).
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
