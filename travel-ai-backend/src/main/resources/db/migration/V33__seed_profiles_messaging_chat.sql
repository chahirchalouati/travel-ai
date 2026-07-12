-- =============================================================================
-- V33: Seed the per-user surfaces — profiles, travel map, photos, inbox, chat
-- -----------------------------------------------------------------------------
-- V31/V32 filled the public catalog + social content. The remaining empty
-- tables are all per-user: profile enrichment, the travel-map (user_places),
-- the photo gallery (user_photos), the support inbox (conversations /
-- conversation_messages) and the AI assistant history (chat_conversations /
-- chat_messages). This brings every traveler account to life so the /profile,
-- messages and assistant screens are populated out of the box.
--
-- Conventions match V31/V32: set-based, deterministic md5()::uuid keys, guarded
-- against pre-existing rows. Scope is the 26 TRAVELER accounts.
-- =============================================================================

-- ── 1. Profile enrichment — avatar, cover, bio, handle, location ─────────────
UPDATE users u
SET avatar_url = COALESCE(u.avatar_url,
      'https://i.pravatar.cc/300?u=' || u.id::text),
    cover_url  = COALESCE(u.cover_url,
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80'),
    bio        = COALESCE(u.bio,
      'Traveller at heart — chasing good food, long walks and the occasional sunrise. '
      || 'Three favourite places on the map and counting.'),
    handle     = COALESCE(u.handle, '@' || lower(u.first_name) || lower(left(u.last_name, 3))),
    location   = COALESCE(u.location, 'Italy')
WHERE u.role = 'TRAVELER';

-- ── 2. Travel map — 3 visited places per traveler (drawn from destinations) ──
-- Each traveler gets 3 distinct destinations chosen pseudo-randomly per user.
INSERT INTO user_places (id, user_id, name, country, latitude, longitude, note, visited_on, created_at, updated_at)
SELECT md5('place-' || u.id::text || '-' || picked.rn::text)::uuid,
       u.id, picked.name, picked.country, picked.latitude, picked.longitude,
       'Loved every minute in ' || picked.name || '.',
       (CURRENT_DATE - ((30 + picked.rn * 90) || ' days')::interval)::date,
       now(), now()
FROM users u
JOIN LATERAL (
  SELECT d.name, d.country, d.latitude, d.longitude,
         row_number() OVER (ORDER BY md5(d.id::text || u.id::text)) AS rn
  FROM destinations d WHERE d.active = true
  ORDER BY md5(d.id::text || u.id::text)
  LIMIT 3
) picked ON true
WHERE u.role = 'TRAVELER'
ON CONFLICT (id) DO NOTHING;

-- ── 3. Photo gallery — 4 photos per traveler ─────────────────────────────────
INSERT INTO user_photos (id, user_id, url, caption, place, created_at, updated_at)
SELECT md5('photo-' || u.id::text || '-' || ph.n::text)::uuid,
       u.id, ph.url, ph.caption,
       (SELECT p.name FROM user_places p WHERE p.user_id = u.id ORDER BY p.visited_on DESC LIMIT 1),
       now(), now()
FROM users u
CROSS JOIN (VALUES
  (1, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 'Golden hour over the rooftops'),
  (2, 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=800', 'Best coffee of the trip'),
  (3, 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800', 'Found this little corner by accident'),
  (4, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Beach day, no regrets')
) AS ph(n, url, caption)
WHERE u.role = 'TRAVELER'
ON CONFLICT (id) DO NOTHING;

-- ── 4. Support inbox — one resolved conversation per first 12 travelers ──────
WITH inbox_users AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn
  FROM users WHERE role = 'TRAVELER'
  ORDER BY id LIMIT 12
)
INSERT INTO conversations (id, user_id, subject, last_message_at, unread_for_user, created_at, updated_at)
SELECT md5('conv-' || iu.id::text)::uuid, iu.id,
       (ARRAY['Question about my booking',
              'Changing travel dates',
              'Invoice request',
              'Dietary requirements at the hotel'])[1 + (iu.rn % 4)],
       now() - INTERVAL '2 days', false,
       now() - INTERVAL '5 days', now() - INTERVAL '2 days'
FROM inbox_users iu
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversation_messages (id, conversation_id, sender, body, created_at, updated_at)
SELECT md5('cmsg-' || c.id::text || '-' || m.n::text)::uuid, c.id, m.sender, m.body,
       now() - ((5 - m.n) || ' days')::interval, now() - ((5 - m.n) || ' days')::interval
FROM conversations c
CROSS JOIN (VALUES
  (1, 'USER',    'Hi! I have a quick question about my upcoming trip — can you help?'),
  (2, 'SUPPORT', 'Of course, happy to help. Could you share your booking reference so I can pull it up?'),
  (3, 'USER',    'Sure, just sent it through. Thanks so much!'),
  (4, 'SUPPORT', 'All sorted on our side — you''re good to go. Have a wonderful trip! 🌍')
) AS m(n, sender, body)
WHERE c.id IN (SELECT md5('conv-' || id::text)::uuid FROM users WHERE role = 'TRAVELER')
ON CONFLICT (id) DO NOTHING;

-- ── 5. AI assistant history — one conversation per first 15 travelers ────────
WITH chat_users AS (
  SELECT u.id, row_number() OVER (ORDER BY u.id) AS rn,
         (SELECT d.name FROM destinations d WHERE d.active = true
          ORDER BY md5(d.id::text || u.id::text) LIMIT 1) AS dest
  FROM users u WHERE u.role = 'TRAVELER'
  ORDER BY u.id LIMIT 15
)
INSERT INTO chat_conversations (id, user_id, title, active, created_at, updated_at)
SELECT md5('chat-' || cu.id::text)::uuid, cu.id,
       'Planning a trip to ' || cu.dest, true,
       now() - INTERVAL '3 days', now() - INTERVAL '3 days'
FROM chat_users cu
ON CONFLICT (id) DO NOTHING;

INSERT INTO chat_messages (id, conversation_id, role, content, created_at)
SELECT md5('chatmsg-' || cc.id::text || '-' || m.n::text)::uuid, cc.id, m.role,
       replace(m.content, '{dest}', regexp_replace(cc.title, '^Planning a trip to ', '')),
       now() - INTERVAL '3 days' + (m.n || ' minutes')::interval
FROM chat_conversations cc
CROSS JOIN (VALUES
  (1, 'user',      'I''m thinking about visiting {dest} for about 5 days. Where should I start?'),
  (2, 'assistant', 'Great choice! For 5 days in {dest} I''d suggest two days exploring the historic centre, '
                || 'one day for a food-focused walk, and a day trip to the surrounding area. Want me to draft a day-by-day plan?'),
  (3, 'user',      'Yes please, and keep it mid-range on budget.'),
  (4, 'assistant', 'On it — I''ll balance a comfortable mid-range hotel with a mix of local eateries and one standout dinner. '
                || 'I''ll send the itinerary shortly so you can tweak anything.')
) AS m(n, role, content)
WHERE cc.id IN (SELECT md5('chat-' || id::text)::uuid FROM users WHERE role = 'TRAVELER')
ON CONFLICT (id) DO NOTHING;
