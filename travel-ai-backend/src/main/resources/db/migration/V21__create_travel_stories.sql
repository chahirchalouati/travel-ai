CREATE TABLE travel_stories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place       VARCHAR(255) NOT NULL,
    country     VARCHAR(255) NOT NULL,
    tag         VARCHAR(120),
    minutes     INTEGER NOT NULL DEFAULT 0,
    poster_url  VARCHAR(1024) NOT NULL,
    video_url   VARCHAR(1024),
    featured    BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE
);

INSERT INTO travel_stories (place, country, tag, minutes, poster_url, video_url, featured, sort_order, created_at) VALUES
('Tropical Coast', 'Maldives', 'Beaches', 3,
 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1200&q=80',
 'https://videos.pexels.com/video-files/2169880/2169880-hd_1920_1080_30fps.mp4',
 TRUE, 1, NOW()),
('Mountain Roads', 'Switzerland', 'Adventure', 2,
 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=900&q=80',
 'https://videos.pexels.com/video-files/3214448/3214448-uhd_2560_1440_25fps.mp4',
 FALSE, 2, NOW()),
('Wild Coastline', 'Portugal', 'Coastline', 4,
 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=900&q=80',
 'https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4',
 FALSE, 3, NOW()),
('Kyoto', 'Japan', 'City Breaks', 3,
 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=900&q=80',
 NULL,
 FALSE, 4, NOW());
