-- Kraft tarixi: foydalanuvchi nima va qancha yasagan (inventardan xomashyo ayirib).
-- Har bir "bulk craft" amali bitta yozuv yaratadi; tarix ko'rinishida ko'rsatiladi.
-- Cascade: user yoki item o'chsa — yozuv ham o'chadi.
CREATE TABLE craft_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT    NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    result_item_id  BIGINT    NOT NULL REFERENCES craft_items(id)   ON DELETE CASCADE,
    result_quantity INTEGER   NOT NULL CHECK (result_quantity > 0),
    game_version_id BIGINT             REFERENCES game_versions(id),
    crafted_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_craft_log_user ON craft_log (user_id, crafted_at DESC);
