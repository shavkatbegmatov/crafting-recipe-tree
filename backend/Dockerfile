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
# (pg_dump / pg_restore). Bazaviy image'ning O'Z repozitoriysidan olinadi: u
# PostgreSQL 18 mijozini beradi, bu esa production'dagi 16 va lokal dev 17.x uchun
# yetarli — pg_dump serverdan ESKI bo'lmasligi shart, yangi bo'lishi mumkin.
#
# PGDG repozitoriysi ATAYLAB ishlatilmaydi: bu image Ubuntu'ga asoslangan, PGDG'ning
# Debian paketlari esa u yerda yo'q kutubxonalarni talab qiladi (libldap-2.5-0) va
# qurilish yiqiladi. Quyidagi versiya tekshiruvi mijoz haqiqatan mavjudligini
# qurilish vaqtidayoq tasdiqlaydi.
RUN apt-get update && apt-get install -y --no-install-recommends curl postgresql-client && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    pg_dump --version && pg_restore --version

ENV SPRING_PROFILES_ACTIVE=prod

# JVM xotira chegaralari. Bayroqsiz JVM konteynerda limit yo'qligi uchun butun server
# RAM'ining 25% ini (~2 GB) heap deb oladi, G1 esa uni kengaytirib OS'ga qaytarmaydi —
# production'da RSS 1,4 GB ga yetgan. Server 8 GB va unda ~10 loyiha turadi, deploy
# paytida esa eski va yangi JVM bir vaqtda tirik bo'ladi (OOM-killer shu payt ishlagan).
#   -Xmx384m          ma'lumot kichik (o'nlab item), keshlar chegaralangan — yetarli zaxira
#   -Xms128m          boshlang'ich heap; aniq berilmasa host RAM'ining 1/64 qismi olinadi va
#                     katta RAM'li mashinada heap darhol -Xmx gacha band bo'lib qoladi
#   UseSerialGC       kichik heap va kam trafikda G1'dan tejamkor, pauzalar o'nlab ms
#   Metaspace/Code    sinf va JIT kodi uchun yuqori chegara (heap'dan tashqari xotira)
#   -Xss512k          har bir thread steki (sukut 1 MB)
#   ExitOnOOM         yarim tirik holatda qolmasdan chiqadi -> restart=unless-stopped ko'taradi
# JAVA_TOOL_OPTIONS bo'lgani uchun Coolify env'idan qayta build'siz almashtirsa bo'ladi.
ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx384m -Xss512k -XX:+UseSerialGC -XX:MaxMetaspaceSize=192m -XX:ReservedCodeCacheSize=64m -XX:+ExitOnOutOfMemoryError"

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
