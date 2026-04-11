-- Seed System Admin user
-- Password: Sysadmin@2025 (BCrypt hash)
INSERT INTO users (id, username, email, password_hash, role, full_name, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'sysadmin',
    'sysadmin@trafficcam.local',
    '$2a$10$ZUiKrx6XOIktFNtDOUA8iOl3Lbmem5UwIcs/v8SaGjULEZFAbXj4i',
    'SYSTEM_ADMIN',
    'System Administrator',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Seed default system config
INSERT INTO system_config (id, config_key, config_value, category, description) VALUES
    (UUID(), 'source_type.rtsp.enabled',       'true',  'VIDEO_SOURCE', 'Enable RTSP source type'),
    (UUID(), 'source_type.http_mjpeg.enabled',  'true',  'VIDEO_SOURCE', 'Enable HTTP/MJPEG source type'),
    (UUID(), 'source_type.webrtc.enabled',      'false', 'VIDEO_SOURCE', 'Enable WebRTC source type'),
    (UUID(), 'source_type.usb.enabled',         'false', 'VIDEO_SOURCE', 'Enable USB/Local source type'),
    (UUID(), 'source_type.hls.enabled',         'true',  'VIDEO_SOURCE', 'Enable HLS source type'),
    (UUID(), 'oauth.google.enabled',            'false', 'OAUTH',        'Enable Google OAuth'),
    (UUID(), 'oauth.google.client_id',          '',      'OAUTH',        'Google OAuth Client ID'),
    (UUID(), 'oauth.google.client_secret',      '',      'OAUTH',        'Google OAuth Client Secret'),
    (UUID(), 'oauth.zalo.enabled',              'false', 'OAUTH',        'Enable Zalo OAuth'),
    (UUID(), 'firebase.enabled',                'false', 'FIREBASE',     'Enable Firebase integration'),
    (UUID(), 'firebase.project_id',             '',      'FIREBASE',     'Firebase Project ID'),
    (UUID(), 'firebase.api_key',                '',      'FIREBASE',     'Firebase API Key');
