CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Default admin: username=admin, password=admin123
INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2a$10$AAwAlr6D7FrmVxDphThgE.PMgvXd5elNHiBeczVsNWRjtrX.XkVBO', 'ADMIN');
