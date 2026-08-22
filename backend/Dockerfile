FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre
WORKDIR /app

# curl — HEALTHCHECK uchun. Rasm fonini o'chirish endi alohida servisda
# (services/rembg) — ilgari shu yerda o'rnatilgan Python ML steki (onnxruntime,
# scipy, numpy) image'ni ~1.5 GB ga shishirardi va har bir deploy'ni sekinlashtirardi.
#
# postgresql-client — admin panelidan baza zaxirasini olish/tiklash uchun
# (pg_dump / pg_restore). Debian bookworm repozitoriysida 15-versiya bor, lekin
# pg_dump serverdan ESKI bo'lmasligi shart, shuning uchun PGDG dan 17 o'rnatiladi
# (production PostgreSQL 16, lokal dev 17.x — ikkalasini ham qamraydi).
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates gnupg && \
    install -d /usr/share/postgresql-common/pgdg && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
        -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc && \
    echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
        > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && apt-get install -y --no-install-recommends postgresql-client-17 && \
    apt-get purge -y --auto-remove gnupg && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    pg_dump --version

ENV SPRING_PROFILES_ACTIVE=prod

COPY --from=build /app/target/*.jar app.jar

# Non-root foydalanuvchi (xavfsizlik) + uploads/backups kataloglari egaligi.
# Named volume birinchi mount'da shu egalik/ruxsatni meros qiladi, shuning uchun appuser yoza oladi.
# backups ATAYLAB uploads'dan tashqarida: /uploads/** ommaviy xizmat qilinadi,
# zaxirada esa parol xeshlari va yozishmalar bor.
RUN useradd -r -u 1001 appuser && mkdir -p uploads backups && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
# Konteyner o'z sog'lig'ini bildiradi (Coolify/orkestrator qayta ishga tushirish qarorlari uchun).
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
