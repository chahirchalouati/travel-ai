-- ─── V16: Seed restaurants for new Italian cities ─────────────────────────────
-- Partner mapping: 006=Torino, 007=Bologna, 008=Genova, 009=Verona, 010=Catania,
-- 011=Bari, 012=Perugia, 013=Lecce, 014=Matera, 015=Tropea,
-- 016=Cinque Terre, 017=Como, 018=Taormina, 019=Sorrento, 020=Cortina

INSERT INTO restaurants (id, partner_id, name, cuisine_type, price_tier, description, city, latitude, longitude, pet_friendly, accessible, image_url, active)
VALUES
-- ── Torino (partner 006) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000011', 'b0000002-0000-0000-0000-000000000006',
 'Del Cambio', 'Piemontese', 4,
 'Aperto dal 1757, uno dei ristoranti piu antichi d''Italia. Soffitti affrescati, specchi dorati e cucina piemontese rivisitata con eleganza. Agnolotti del plin e tartufo d''Alba protagonisti del menu.',
 'Torino', 45.0677, 7.6825, false, true,
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', true),

('d0000004-0000-0000-0000-000000000012', 'b0000002-0000-0000-0000-000000000006',
 'Trattoria della Posta', 'Piemontese', 2,
 'Trattoria storica nel cuore del Quadrilatero Romano. Bagna cauda, vitello tonnato e bollito misto serviti con genuinita e calore. Ottima selezione di Barolo e Barbaresco.',
 'Torino', 45.0735, 7.6803, true, false,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true),

('d0000004-0000-0000-0000-000000000013', 'b0000002-0000-0000-0000-000000000006',
 'Guido Gobino Cioccolateria', 'Cioccolateria', 2,
 'Il tempio del cioccolato torinese. Giandujotti artigianali, cremini e cioccolata calda preparata con cacao monorigine. Degustazioni guidate nel laboratorio storico.',
 'Torino', 45.0622, 7.6889, false, true,
 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=800', true),

-- ── Bologna (partner 007) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000014', 'b0000002-0000-0000-0000-000000000007',
 'Trattoria Anna Maria', 'Bolognese', 2,
 'Istituzione bolognese dal 1984. Le tagliatelle al ragu piu famose della citta, tortellini in brodo di cappone e lasagne verdi fatte a mano ogni mattina.',
 'Bologna', 44.4963, 11.3510, false, true,
 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800', true),

('d0000004-0000-0000-0000-000000000015', 'b0000002-0000-0000-0000-000000000007',
 'I Portici', 'Emiliana', 4,
 'Una stella Michelin sotto i portici di Via Indipendenza. Cucina emiliana contemporanea con ingredienti del territorio: mortadella di Favola, Parmigiano 36 mesi e aceto balsamico tradizionale.',
 'Bologna', 44.5001, 11.3428, false, true,
 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', true),

('d0000004-0000-0000-0000-000000000016', 'b0000002-0000-0000-0000-000000000007',
 'Osteria dell''Orsa', 'Bolognese', 1,
 'Storica osteria nella zona universitaria, ritrovo di studenti e buongustai. Tigelle, crescentine e taglieri di salumi emiliani a prezzi onesti. Atmosfera vivace e informale.',
 'Bologna', 44.4978, 11.3519, true, false,
 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800', true),

-- ── Genova (partner 008) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000017', 'b0000002-0000-0000-0000-000000000008',
 'Trattoria da Maria', 'Ligure', 1,
 'Leggendaria trattoria genovese con menu scritto a mano ogni giorno. Trofie al pesto, focaccia di Recco e minestrone alla genovese. Niente fronzoli, solo sapore autentico.',
 'Genova', 44.4073, 8.9340, false, false,
 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800', true),

('d0000004-0000-0000-0000-000000000018', 'b0000002-0000-0000-0000-000000000008',
 'Il Marin', 'Pesce', 3,
 'Ristorante di pesce al Porto Antico con vista sul mare. Crudo di gamberi rossi, frittura mista del Golfo e cappon magro. Design moderno firmato Renzo Piano.',
 'Genova', 44.4089, 8.9275, false, true,
 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800', true),

('d0000004-0000-0000-0000-000000000019', 'b0000002-0000-0000-0000-000000000008',
 'Sa Pesta', 'Ligure', 2,
 'Friggitoria storica dal 1893 nei caruggi del centro. Farinata, panissa e verdure fritte secondo la tradizione ligure. Locale piccolo e sempre affollato, segno di qualita.',
 'Genova', 44.4081, 8.9330, true, false,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true),

-- ── Verona (partner 009) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000020', 'b0000002-0000-0000-0000-000000000009',
 'Il Desco', 'Veneta', 4,
 'Alta cucina veneta in un palazzo del XVI secolo. Risotto all''Amarone, bigoli con ragu d''anatra e dolci ispirati ai capolavori di Veronese. Cantina con 800 etichette della Valpolicella.',
 'Verona', 45.4421, 10.9972, false, true,
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', true),

('d0000004-0000-0000-0000-000000000021', 'b0000002-0000-0000-0000-000000000009',
 'Osteria al Duca', 'Veronese', 2,
 'A due passi dalla casa di Giulietta, pastissada de caval e peara serviti con vini della zona. Ambiente rustico con muri in pietra e travi a vista. Ospitalita veronese genuina.',
 'Verona', 45.4426, 10.9985, true, false,
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', true),

('d0000004-0000-0000-0000-000000000022', 'b0000002-0000-0000-0000-000000000009',
 'Trattoria al Pompiere', 'Veronese', 3,
 'Trattoria elegante nel ghetto ebraico, aperta dal 1929. Bollito con peara, tortellini di Valeggio e risotto al tastasal. Affreschi originali e atmosfera d''altri tempi.',
 'Verona', 45.4415, 10.9968, false, true,
 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', true),

-- ── Catania (partner 010) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000023', 'b0000002-0000-0000-0000-000000000010',
 'Me Cumpari Turiddu', 'Siciliana', 2,
 'Cucina siciliana autentica nel cuore della Pescheria. Pasta alla Norma, arancini di ragu e caponata preparati con prodotti dell''Etna. Vivace atmosfera di mercato.',
 'Catania', 37.5024, 15.0872, false, false,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true),

('d0000004-0000-0000-0000-000000000024', 'b0000002-0000-0000-0000-000000000010',
 'Osteria Antica Marina', 'Pesce', 3,
 'Ristorante di pesce affacciato sul mercato storico del pesce. Crudo di ricciola, spaghetti ai ricci di mare e frittura di paranza. Il pescato arriva ogni mattina dal porto.',
 'Catania', 37.5020, 15.0878, false, true,
 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800', true),

('d0000004-0000-0000-0000-000000000025', 'b0000002-0000-0000-0000-000000000010',
 'FUD Bottega Sicula', 'Siciliana', 1,
 'Street food siciliano gourmet: panini con ingredienti DOP, granita con brioche e cannoli ripieni al momento. Locale giovane e informale vicino a Via Etnea.',
 'Catania', 37.5075, 15.0838, true, true,
 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', true),

-- ── Bari (partner 011) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000026', 'b0000002-0000-0000-0000-000000000011',
 'Terranima', 'Pugliese', 2,
 'Cucina pugliese di terra nel borgo antico. Orecchiette alle cime di rapa, fave e cicorie e bombette alla barese. Ingredienti a km zero dalle masserie del Tavoliere.',
 'Bari', 41.1269, 16.8688, false, true,
 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800', true),

('d0000004-0000-0000-0000-000000000027', 'b0000002-0000-0000-0000-000000000011',
 'Biancofiore', 'Pesce', 3,
 'Ristorante di pesce elegante sul lungomare. Polpo alla brace con crema di burrata, spaghetti allo scoglio e crudo di gamberi dell''Adriatico. Terrazza con vista mare.',
 'Bari', 41.1231, 16.8654, false, true,
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', true),

('d0000004-0000-0000-0000-000000000028', 'b0000002-0000-0000-0000-000000000011',
 'La Tana del Polpo', 'Pugliese', 1,
 'Trattoria popolare nella citta vecchia. Focaccia barese, panzerotti fritti e sgagliozze. Cucina semplice e schietta come la tradizione impone. Prezzi imbattibili.',
 'Bari', 41.1282, 16.8710, true, false,
 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800', true),

-- ── Perugia (partner 012) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000029', 'b0000002-0000-0000-0000-000000000012',
 'Osteria a Priori', 'Umbra', 3,
 'Nel centro storico medievale, cucina umbra con tartufo nero di Norcia, strangozzi al sagrantino e porchetta cotta nel forno a legna. Cantina scavata nella roccia.',
 'Perugia', 43.1107, 12.3886, false, true,
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', true),

('d0000004-0000-0000-0000-000000000030', 'b0000002-0000-0000-0000-000000000012',
 'Sandri Pasticceria', 'Pasticceria Umbra', 2,
 'Pasticceria storica dal 1860 con affreschi Liberty. Torcolo di San Costanzo, cioccolato perugino e dolci alle nocciole di Corciano. Un caffe qui e un viaggio nel tempo.',
 'Perugia', 43.1117, 12.3893, false, true,
 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=800', true),

-- ── Lecce (partner 013) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000031', 'b0000002-0000-0000-0000-000000000013',
 'Le Zie Trattoria', 'Salentina', 2,
 'Trattoria nel cuore del barocco leccese. Ciceri e tria, pure di fave con cicorie amare e rustico leccese. Ricette delle nonne salentine tramandate con devozione.',
 'Lecce', 40.3516, 18.1718, true, false,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true),

('d0000004-0000-0000-0000-000000000032', 'b0000002-0000-0000-0000-000000000013',
 'Bros'' Lecce', 'Salentina Contemporanea', 4,
 'Cucina d''avanguardia salentina con una stella Michelin. Ingredienti del territorio reinterpretati con tecniche moderne. Menu degustazione che racconta il Salento in chiave contemporanea.',
 'Lecce', 40.3529, 18.1702, false, true,
 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', true),

-- ── Matera (partner 014) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000033', 'b0000002-0000-0000-0000-000000000014',
 'Oi Mari', 'Lucana', 2,
 'Ristorante scavato nei Sassi con vista mozzafiato sulla Gravina. Peperoni cruschi, cavatelli con rucola e salsiccia, pane di Matera cotto nel forno rupestre. Magia pura.',
 'Matera', 40.6663, 16.6115, false, false,
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', true),

('d0000004-0000-0000-0000-000000000034', 'b0000002-0000-0000-0000-000000000014',
 'Baccanti Ristorante', 'Lucana', 3,
 'Cucina lucana raffinata in un sasso del XIII secolo. Lampascioni fritti, agnello delle Murge e dolci al miele di castagno. Atmosfera intima tra pareti di tufo millenario.',
 'Matera', 40.6658, 16.6108, false, true,
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', true),

-- ── Tropea (partner 015) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000035', 'b0000002-0000-0000-0000-000000000015',
 'La Lamia', 'Calabrese', 2,
 'Terrazza panoramica sul mare turchese di Tropea. Fileja alla ''nduja, cipolla rossa di Tropea caramellata e pesce spada alla ghiotta. Tramonti indimenticabili inclusi nel prezzo.',
 'Tropea', 38.6769, 15.8975, true, false,
 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800', true),

('d0000004-0000-0000-0000-000000000036', 'b0000002-0000-0000-0000-000000000015',
 'Osteria del Pescatore', 'Pesce Calabrese', 3,
 'Pesce freschissimo dal porto di Tropea. Tartare di tonno rosso, linguine ai frutti di mare e frittura di paranza croccante. Il pescatore porta il pesce direttamente in cucina.',
 'Tropea', 38.6758, 15.8968, false, true,
 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800', true),

-- ── Cinque Terre (partner 016) ──────────────────────────────────
('d0000004-0000-0000-0000-000000000037', 'b0000002-0000-0000-0000-000000000016',
 'Nessun Dorma', 'Ligure', 2,
 'Bar e ristorante con la terrazza piu fotografata delle Cinque Terre a Manarola. Pesto fresco, focaccia e acciughe di Monterosso. Vista sui vigneti a picco sul mare.',
 'Manarola', 44.1066, 9.7277, false, false,
 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800', true),

('d0000004-0000-0000-0000-000000000038', 'b0000002-0000-0000-0000-000000000016',
 'Gambero Rosso', 'Pesce Ligure', 3,
 'Ristorante stellato a Vernazza, affacciato sulla piazzetta del porto. Acciughe marinate, totani ripieni e trofie al pesto con patate e fagiolini. Il mare nel piatto.',
 'Vernazza', 44.1355, 9.6842, false, true,
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', true),

-- ── Como (partner 017) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000039', 'b0000002-0000-0000-0000-000000000017',
 'Il Gatto Nero', 'Lariana', 4,
 'Ristorante panoramico a Cernobbio con vista spettacolare sul Lago di Como. Missoltini, risotto con pesce persico e filetto di lavarello. Tra i ristoranti piu amati del lago.',
 'Como', 45.8469, 9.0755, false, true,
 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', true),

('d0000004-0000-0000-0000-000000000040', 'b0000002-0000-0000-0000-000000000017',
 'Osteria del Gallo', 'Lombarda Lacustre', 2,
 'Trattoria accogliente nel centro di Como. Polenta uncia, casoeula leggera e pesce di lago alla griglia. Vini delle colline lariane e grappa artigianale.',
 'Como', 45.8111, 9.0832, true, false,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true),

-- ── Taormina (partner 018) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000041', 'b0000002-0000-0000-0000-000000000018',
 'Vineria Modi', 'Siciliana d''Autore', 3,
 'Enoteca e ristorante intimo vicino al Teatro Greco. Carpaccio di pesce, busiate alla trapanese e cannolo destrutturato. Selezione di vini etnei vulcanici.',
 'Taormina', 37.8523, 15.2885, false, true,
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', true),

('d0000004-0000-0000-0000-000000000042', 'b0000002-0000-0000-0000-000000000018',
 'Trattoria da Nino', 'Siciliana', 2,
 'Trattoria a conduzione familiare dal 1965 sulla passeggiata principale. Pasta con le sarde, involtini di pesce spada e granita con brioche. Semplicita che conquista.',
 'Taormina', 37.8516, 15.2878, true, false,
 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800', true),

-- ── Sorrento (partner 019) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000043', 'b0000002-0000-0000-0000-000000000019',
 'Il Buco', 'Campana', 4,
 'Una stella Michelin in un ex convento del XII secolo. Gnocchi alla sorrentina, pesce del Golfo e delizia al limone. Cantina ricavata dalla vecchia cripta monastica.',
 'Sorrento', 40.6263, 14.3758, false, true,
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', true),

('d0000004-0000-0000-0000-000000000044', 'b0000002-0000-0000-0000-000000000019',
 'Donna Sofia', 'Campana', 2,
 'Trattoria con terrazza sui limoneti di Sorrento. Ravioli capresi, parmigiana di melanzane e baba al limoncello. Profumo di zagara e vista sul Vesuvio.',
 'Sorrento', 40.6275, 14.3771, true, true,
 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800', true),

-- ── Cortina (partner 020) ──────────────────────────────────────
('d0000004-0000-0000-0000-000000000045', 'b0000002-0000-0000-0000-000000000020',
 'Baita Fraina', 'Ampezzana', 3,
 'Baita alpina tra i boschi delle Dolomiti. Canederli allo speck, casunziei all''ampezzana e strudel di mele con panna fresca. Camino acceso e neve fuori dalla finestra.',
 'Cortina d''Ampezzo', 46.5405, 12.1357, true, false,
 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800', true),

('d0000004-0000-0000-0000-000000000046', 'b0000002-0000-0000-0000-000000000020',
 'Ristorante Tivoli', 'Tirolese', 4,
 'Cucina d''alta montagna con vista sulle Tofane. Cervo con frutti di bosco, fonduta di Montasio e kaiserschmarrn. Eleganza alpina con prodotti delle malghe locali.',
 'Cortina d''Ampezzo', 46.5369, 12.1391, false, true,
 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', true);

-- ─── Availability for next 60 days ─────────────────────────────────────────────
INSERT INTO restaurant_availability (id, restaurant_id, date, time_slot, covers_available)
SELECT uuid_generate_v4(), r.id, (CURRENT_DATE + s.day_offset)::DATE, slot.time_slot::TIME,
  CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + s.day_offset) IN (5,6) THEN FLOOR(RANDOM()*4+2)::SMALLINT
       ELSE FLOOR(RANDOM()*6+4)::SMALLINT END
FROM restaurants r
CROSS JOIN generate_series(1, 59) AS s(day_offset)
CROSS JOIN (VALUES ('12:30'),('13:00'),('13:30'),('19:30'),('20:00'),('20:30'),('21:00')) AS slot(time_slot)
WHERE r.id >= 'd0000004-0000-0000-0000-000000000011';
