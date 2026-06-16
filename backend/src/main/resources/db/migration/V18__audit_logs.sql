-- Audit jurnali: kim, qachon, nima ustida qanday amal bajardi. Faqat qo'shiladigan (append-only) jadval.
-- Actor entity emas, foydalanuvchi nomi sifatida saqlanadi — u o'chirilsa ham tarix yo'qolmaydi.
CREATE TABLE audit_logs (
    id             BIGSERIAL    PRIMARY KEY,
    actor_username VARCHAR(50),
    action         VARCHAR(40)  NOT NULL,
    target_type    VARCHAR(40)  NOT NULL,
    target_id      BIGINT,
    summary        VARCHAR(500),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Asosiy ko'rinish — vaqt bo'yicha teskari; filtrlar — actor va ob'ekt bo'yicha.
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_actor   ON audit_logs (actor_username);
CREATE INDEX idx_audit_logs_target  ON audit_logs (target_type, target_id);
