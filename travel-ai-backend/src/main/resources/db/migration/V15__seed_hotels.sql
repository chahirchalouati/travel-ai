-- ============================================================
-- V15 — Seed Hotels for New Italian Cities
-- 45 hotels across 15 cities + availability for 120 days
-- ============================================================

INSERT INTO hotels (id, partner_id, name, stars, description, city, latitude, longitude, pet_friendly, accessible, family_friendly, sea_proximity, image_url, base_price_night, active)
VALUES
-- ─── Torino (partner 009) ──────────────────────────────────
('c0000003-0000-0000-0000-000000000016', 'a0000001-0000-0000-0000-000000000009',
 'Grand Hotel Sitea Torino', 5,
 'Eleganza sabauda nel cuore di Torino, a pochi passi da Piazza San Carlo. Interni raffinati con arredi d''epoca, ristorante stellato e cantina di vini piemontesi pregiati.',
 'Torino', 45.0677, 7.6824, false, true, false, false,
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 245.00, true),

('c0000003-0000-0000-0000-000000000017', 'a0000001-0000-0000-0000-000000000009',
 'Hotel Principi di Piemonte', 4,
 'Storico palazzo torinese con vista sulle Alpi. Camere spaziose con soffitti affrescati, colazione con specialità piemontesi e accesso diretto alla Mole Antonelliana.',
 'Torino', 45.0635, 7.6814, true, true, true, false,
 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', 175.00, true),

('c0000003-0000-0000-0000-000000000018', 'a0000001-0000-0000-0000-000000000009',
 'Albergo San Giorgio Torino', 3,
 'Hotel accogliente nel quartiere del Quadrilatero Romano. Posizione ideale per esplorare i mercati storici, i caffè torinesi e il Museo Egizio.',
 'Torino', 45.0730, 7.6780, true, false, true, false,
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 85.00, true),

-- ─── Bologna (partner 010) ─────────────────────────────────
('c0000003-0000-0000-0000-000000000019', 'a0000001-0000-0000-0000-000000000010',
 'Grand Hotel Majestic già Baglioni', 5,
 'Il più antico hotel di lusso di Bologna, ospitato in un palazzo del XVIII secolo. Affreschi dei Carracci, cucina emiliana raffinata e cantina sotterranea con resti romani.',
 'Bologna', 44.4949, 11.3426, false, true, false, false,
 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 290.00, true),

('c0000003-0000-0000-0000-000000000020', 'a0000001-0000-0000-0000-000000000010',
 'Hotel Corona d''Oro Bologna', 4,
 'Palazzo medievale nel cuore dei portici bolognesi. Soffitti a cassettoni originali, terrazza panoramica con vista sulle Due Torri e colazione con tortellini fatti a mano.',
 'Bologna', 44.4938, 11.3440, false, true, true, false,
 'https://images.unsplash.com/photo-1551882547-ff40c63fe2f6?w=800', 165.00, true),

('c0000003-0000-0000-0000-000000000021', 'a0000001-0000-0000-0000-000000000010',
 'Albergo delle Drapperie', 3,
 'Piccolo hotel di charme nel mercato storico delle Drapperie. Atmosfera autentica bolognese, camere con travi a vista e la migliore gastronomia emiliana a portata di mano.',
 'Bologna', 44.4955, 11.3470, true, false, false, false,
 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', 95.00, true),

-- ─── Genova (partner 011) ──────────────────────────────────
('c0000003-0000-0000-0000-000000000022', 'a0000001-0000-0000-0000-000000000011',
 'Hotel Bristol Palace Genova', 5,
 'Palazzo storico affacciato su Via XX Settembre con scalinata elicoidale iconica. Camere con stucchi originali, ristorante con vista sul Porto Antico e tradizione ligure.',
 'Genova', 44.4072, 8.9340, false, true, false, true,
 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 220.00, true),

('c0000003-0000-0000-0000-000000000023', 'a0000001-0000-0000-0000-000000000011',
 'Hotel Palazzo Grillo Genova', 4,
 'Dimora nobiliare nei caruggi genovesi, patrimonio UNESCO. Affreschi del Seicento, terrazza panoramica sul Porto Antico e l''Acquario a cinque minuti a piedi.',
 'Genova', 44.4085, 8.9310, false, true, true, true,
 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800', 155.00, true),

('c0000003-0000-0000-0000-000000000024', 'a0000001-0000-0000-0000-000000000011',
 'Albergo Marina di Nervi', 3,
 'Hotel sul lungomare di Nervi con accesso diretto alla passeggiata Anita Garibaldi. Brezza marina, giardini storici e tranquillità a pochi minuti dal centro di Genova.',
 'Genova', 44.3820, 8.9760, true, false, true, true,
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 105.00, true),

-- ─── Verona (partner 012) ──────────────────────────────────
('c0000003-0000-0000-0000-000000000025', 'a0000001-0000-0000-0000-000000000012',
 'Hotel Palazzo Victoria Verona', 5,
 'Palazzo del XIV secolo nel cuore di Verona, a due passi dall''Arena. Design contemporaneo fuso con architettura medievale, spa esclusiva e giardino segreto.',
 'Verona', 45.4384, 10.9916, false, true, false, false,
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 310.00, true),

('c0000003-0000-0000-0000-000000000026', 'a0000001-0000-0000-0000-000000000012',
 'Hotel Accademia Verona', 4,
 'Elegante hotel nel centro storico veronese con vista sulla Torre dei Lamberti. Colazione sulla terrazza panoramica, perfetto per le serate liriche all''Arena.',
 'Verona', 45.4420, 10.9945, true, true, true, false,
 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', 180.00, true),

('c0000003-0000-0000-0000-000000000027', 'a0000001-0000-0000-0000-000000000012',
 'Locanda di Giulietta', 3,
 'Piccola locanda romantica vicino alla Casa di Giulietta. Camere con balconcino fiorito, atmosfera shakespeariana e posizione perfetta per il centro storico.',
 'Verona', 45.4420, 10.9988, true, false, false, false,
 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 90.00, true),

-- ─── Catania (partner 013) ─────────────────────────────────
('c0000003-0000-0000-0000-000000000028', 'a0000001-0000-0000-0000-000000000013',
 'Palace Hotel Catania', 5,
 'Hotel di lusso con vista sull''Etna e sul mare Ionio. Terrazza panoramica con piscina infinity, cucina siciliana raffinata e accesso diretto alla spiaggia di lava nera.',
 'Catania', 37.5079, 15.0830, false, true, true, true,
 'https://images.unsplash.com/photo-1551882547-ff40c63fe2f6?w=800', 260.00, true),

('c0000003-0000-0000-0000-000000000029', 'a0000001-0000-0000-0000-000000000013',
 'Hotel Etnea 316 Catania', 4,
 'Design hotel sulla Via Etnea con terrazza rooftop sull''Etna. Arredamento contemporaneo siciliano, colazione con granita e brioche, centro storico barocco a portata di mano.',
 'Catania', 37.5023, 15.0870, true, true, false, false,
 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', 145.00, true),

('c0000003-0000-0000-0000-000000000030', 'a0000001-0000-0000-0000-000000000013',
 'Albergo Porta Uzeda', 3,
 'Hotel accogliente nel quartiere della Pescheria, il mercato del pesce più vivace di Sicilia. Camere luminose, terrazza con vista sul Duomo e street food catanese fuori dalla porta.',
 'Catania', 37.5010, 15.0900, false, false, true, true,
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 80.00, true),

-- ─── Bari (partner 014) ────────────────────────────────────
('c0000003-0000-0000-0000-000000000031', 'a0000001-0000-0000-0000-000000000014',
 'Hotel Oriente Bari', 5,
 'Storico palazzo liberty sul lungomare di Bari. Camere con vista sull''Adriatico, ristorante di pesce fresco del giorno e terrazza con tramonto mozzafiato sulla città vecchia.',
 'Bari', 41.1171, 16.8719, false, true, false, true,
 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 235.00, true),

('c0000003-0000-0000-0000-000000000032', 'a0000001-0000-0000-0000-000000000014',
 'Hotel Palazzo Mercantile', 4,
 'Dimora storica nel cuore di Bari Vecchia, affacciata sulla piazza del Ferrarese. Pietra locale a vista, cortile interno e le orecchiette della nonna a colazione.',
 'Bari', 41.1260, 16.8700, true, true, true, true,
 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800', 150.00, true),

('c0000003-0000-0000-0000-000000000033', 'a0000001-0000-0000-0000-000000000014',
 'Albergo delle Puglie', 3,
 'Hotel familiare nel quartiere Murat con balconi sulla movida barese. Camere semplici e curate, posizione ideale per il teatro Petruzzelli e il lungomare.',
 'Bari', 41.1243, 16.8690, true, false, true, false,
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 75.00, true),

-- ─── Perugia (partner 015) ─────────────────────────────────
('c0000003-0000-0000-0000-000000000034', 'a0000001-0000-0000-0000-000000000015',
 'Brufani Palace Hotel Perugia', 5,
 'Hotel di lusso affacciato sulla Valle Umbra con piscina ricavata in resti etruschi sotterranei. Eleganza senza tempo, cucina umbra con tartufo nero e vista che spazia fino ad Assisi.',
 'Perugia', 43.1107, 12.3890, false, true, false, false,
 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', 280.00, true),

('c0000003-0000-0000-0000-000000000035', 'a0000001-0000-0000-0000-000000000015',
 'Hotel Fortuna Perugia', 3,
 'Hotel nel centro storico perugino con terrazza panoramica sulla Valle Umbra. Atmosfera medievale autentica, perfetto per Eurochocolate e Umbria Jazz.',
 'Perugia', 43.1120, 12.3870, true, false, true, false,
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 95.00, true),

('c0000003-0000-0000-0000-000000000052', 'a0000001-0000-0000-0000-000000000015',
 'Locanda della Posta Perugia', 4,
 'La più antica locanda di Perugia, frequentata da Goethe e Hans Christian Andersen. Corso Vannucci sotto le finestre, cioccolato perugino a colazione e sale affrescate.',
 'Perugia', 43.1115, 12.3880, false, true, false, false,
 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', 155.00, true),

-- ─── Lecce (partner 016) ───────────────────────────────────
('c0000003-0000-0000-0000-000000000036', 'a0000001-0000-0000-0000-000000000016',
 'Patria Palace Hotel Lecce', 5,
 'Palazzo barocco del XVII secolo nel cuore di Lecce, affacciato sulla Basilica di Santa Croce. Terrazza rooftop con vista sui campanili, cucina salentina d''autore e pietra leccese ovunque.',
 'Lecce', 40.3516, 18.1718, false, true, false, false,
 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 230.00, true),

('c0000003-0000-0000-0000-000000000037', 'a0000001-0000-0000-0000-000000000016',
 'Masseria Torre del Parco', 4,
 'Masseria del XV secolo con torre normanna trasformata in boutique hotel. Giardini mediterranei, piscina tra gli ulivi e il Salento più autentico.',
 'Lecce', 40.3480, 18.1650, true, false, true, false,
 'https://images.unsplash.com/photo-1551882547-ff40c63fe2f6?w=800', 185.00, true),

('c0000003-0000-0000-0000-000000000053', 'a0000001-0000-0000-0000-000000000016',
 'Albergo del Barocco Leccese', 3,
 'Hotel di charme tra i vicoli del centro storico leccese. Volte in pietra leccese, cortile con ulivo secolare e pasticciotto caldo ogni mattina dalla pasticceria accanto.',
 'Lecce', 40.3530, 18.1740, true, false, false, false,
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 78.00, true),

-- ─── Matera (partner 017) ──────────────────────────────────
('c0000003-0000-0000-0000-000000000038', 'a0000001-0000-0000-0000-000000000017',
 'Sextantio Le Grotte della Civita', 5,
 'Albergo diffuso ricavato nelle grotte dei Sassi di Matera, patrimonio UNESCO. Camere scavate nella roccia con arredi essenziali e candele. Un''esperienza unica e primordiale.',
 'Matera', 40.6654, 16.6118, false, false, false, false,
 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 350.00, true),

('c0000003-0000-0000-0000-000000000039', 'a0000001-0000-0000-0000-000000000017',
 'Hotel Sassi di Matera', 4,
 'Hotel ricavato nei Sassi con terrazze panoramiche sulla Gravina. Camere in tufo con volte a botte, colazione lucana con pane di Matera e vista che toglie il fiato.',
 'Matera', 40.6640, 16.6100, false, true, true, false,
 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800', 195.00, true),

('c0000003-0000-0000-0000-000000000054', 'a0000001-0000-0000-0000-000000000017',
 'Locanda di San Martino Matera', 3,
 'Locanda ricavata in un antico monastero nei Sassi. Terme romane sotterranee, camere scavate nel tufo e colazione con focaccia materana e marmellate fatte in casa.',
 'Matera', 40.6660, 16.6090, true, false, true, false,
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 120.00, true),

-- ─── Tropea (partner 018) ──────────────────────────────────
('c0000003-0000-0000-0000-000000000040', 'a0000001-0000-0000-0000-000000000018',
 'Hotel Rocca Nettuno Tropea', 4,
 'Hotel a strapiombo sul mare turchese della Costa degli Dei. Accesso privato alla spiaggia, vista sull''Isola di Santa Maria e tramonti calabresi indimenticabili.',
 'Tropea', 38.6765, 15.8960, false, true, true, true,
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 175.00, true),

('c0000003-0000-0000-0000-000000000041', 'a0000001-0000-0000-0000-000000000018',
 'Albergo della Costa degli Dei', 3,
 'Piccolo hotel familiare con terrazza sul mare e giardino di bouganville. Cipolla rossa di Tropea a colazione, spiaggia raggiungibile a piedi e ospitalità calabrese genuina.',
 'Tropea', 38.6780, 15.8940, true, false, true, true,
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 105.00, true),

('c0000003-0000-0000-0000-000000000055', 'a0000001-0000-0000-0000-000000000018',
 'Resort Terrazzo sul Mare Tropea', 5,
 'Resort esclusivo sulla scogliera di Tropea con infinity pool sospesa sul Tirreno. Suite con vasca panoramica, ristorante di pesce con nduja e cipolla rossa e spiaggia privata.',
 'Tropea', 38.6750, 15.8970, false, true, false, true,
 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', 320.00, true),

-- ─── Cinque Terre (partner 019) ────────────────────────────
('c0000003-0000-0000-0000-000000000042', 'a0000001-0000-0000-0000-000000000019',
 'Hotel Porto Roca Monterosso', 4,
 'Hotel a picco sul mare delle Cinque Terre con terrazza panoramica mozzafiato. Accesso diretto ai sentieri costieri, camere con vista sul Tirreno e cucina ligure di mare.',
 'Monterosso al Mare', 44.1455, 9.6540, false, true, false, true,
 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', 250.00, true),

('c0000003-0000-0000-0000-000000000043', 'a0000001-0000-0000-0000-000000000019',
 'Locanda del Borgo Riomaggiore', 3,
 'Locanda colorata nel borgo di Riomaggiore con vista sulla Via dell''Amore. Camere con pareti in pietra, terrazzino sul mare e pesto genovese fatto in casa.',
 'Riomaggiore', 44.0993, 9.7380, true, false, false, true,
 'https://images.unsplash.com/photo-1551882547-ff40c63fe2f6?w=800', 165.00, true),

('c0000003-0000-0000-0000-000000000056', 'a0000001-0000-0000-0000-000000000019',
 'Hotel La Colonnina Vernazza', 3,
 'Piccolo hotel nel cuore di Vernazza con terrazza a picco sul porticciolo. Camere con vista sul mare, focaccia di Recco a colazione e sentieri delle Cinque Terre dalla porta.',
 'Vernazza', 44.1350, 9.6840, false, false, false, true,
 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 140.00, true),

-- ─── Como (partner 020) ────────────────────────────────────
('c0000003-0000-0000-0000-000000000044', 'a0000001-0000-0000-0000-000000000020',
 'Grand Hotel Tremezzo', 5,
 'Leggendario palazzo liberty sul Lago di Como con piscina galleggiante. Giardini botanici, spa con vista sul lago e il fascino dell''epoca d''oro del Grand Tour italiano.',
 'Tremezzina', 45.9870, 9.2270, false, true, true, false,
 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 580.00, true),

('c0000003-0000-0000-0000-000000000045', 'a0000001-0000-0000-0000-000000000020',
 'Hotel Bellagio Lario', 4,
 'Hotel con vista panoramica dalla perla del Lago di Como. Terrazza sul promontorio, giardini fioriti e partenza ideale per escursioni in battello verso le ville storiche.',
 'Bellagio', 45.9880, 9.2620, true, true, false, false,
 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 220.00, true),

('c0000003-0000-0000-0000-000000000057', 'a0000001-0000-0000-0000-000000000020',
 'Albergo Terminus Como', 4,
 'Hotel liberty sulla riva del Lago di Como con giardino all''italiana. Terrazza con vista sul primo bacino, atmosfera da Belle Époque e funicolare per Brunate a due passi.',
 'Como', 45.8100, 9.0850, true, true, true, false,
 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800', 195.00, true),

-- ─── Taormina (partner 021) ────────────────────────────────
('c0000003-0000-0000-0000-000000000046', 'a0000001-0000-0000-0000-000000000021',
 'Belmond Grand Hotel Timeo', 5,
 'Hotel leggendario accanto al Teatro Greco di Taormina con vista sull''Etna e sul mare. Giardini terrazzati, ristorante stellato e il punto più scenografico di tutta la Sicilia.',
 'Taormina', 37.8524, 15.2920, false, true, false, true,
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 520.00, true),

('c0000003-0000-0000-0000-000000000047', 'a0000001-0000-0000-0000-000000000021',
 'Hotel Villa Schuler Taormina', 4,
 'Villa storica con giardino subtropicale e vista sull''Etna e sulla baia di Naxos. Atmosfera intima, colazione in terrazza tra bouganville e gelsomini siciliani.',
 'Taormina', 37.8515, 15.2880, true, false, true, true,
 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800', 195.00, true),

('c0000003-0000-0000-0000-000000000058', 'a0000001-0000-0000-0000-000000000021',
 'Hotel Metropole Taormina', 3,
 'Hotel sul Corso Umberto di Taormina con terrazza panoramica sull''Etna e Isola Bella. Camere con maioliche siciliane, granite fresche al bar e vita notturna sotto le stelle.',
 'Taormina', 37.8530, 15.2860, true, false, true, true,
 'https://images.unsplash.com/photo-1551882547-ff40c63fe2f6?w=800', 130.00, true),

-- ─── Sorrento (partner 022) ────────────────────────────────
('c0000003-0000-0000-0000-000000000048', 'a0000001-0000-0000-0000-000000000022',
 'Grand Hotel Excelsior Vittoria', 5,
 'Palazzo storico a strapiombo sul Golfo di Napoli dove soggiornò Caruso. Giardini con agrumeto, piscina panoramica e vista su Vesuvio e Capri che non si dimentica.',
 'Sorrento', 40.6263, 14.3758, false, true, false, true,
 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', 450.00, true),

('c0000003-0000-0000-0000-000000000049', 'a0000001-0000-0000-0000-000000000022',
 'Hotel La Favorita Sorrento', 4,
 'Hotel elegante nel centro di Sorrento con piscina tra i limoneti. Terrazza con vista sul Vesuvio, cucina sorrentina con limoni del giardino e partenza per Capri e Costiera.',
 'Sorrento', 40.6255, 14.3730, true, true, true, true,
 'https://images.unsplash.com/photo-1551882547-ff40c63fe2f6?w=800', 210.00, true),

('c0000003-0000-0000-0000-000000000059', 'a0000001-0000-0000-0000-000000000022',
 'Hotel Minerva Sorrento', 3,
 'Hotel a conduzione familiare con terrazza panoramica sul Golfo di Napoli. Giardino di limoni, piscina con vista su Capri e limoncello della casa offerto al tramonto.',
 'Sorrento', 40.6240, 14.3770, true, false, true, true,
 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', 125.00, true),

-- ─── Cortina (partner 023) ─────────────────────────────────
('c0000003-0000-0000-0000-000000000050', 'a0000001-0000-0000-0000-000000000023',
 'Cristallo Resort & Spa Cortina', 5,
 'Resort alpino di lusso ai piedi delle Dolomiti patrimonio UNESCO. Spa panoramica, piste da sci a portata di funivia, cucina ladina d''autore e il fascino della Regina delle Dolomiti.',
 'Cortina d''Ampezzo', 46.5405, 12.1357, false, true, true, false,
 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 420.00, true),

('c0000003-0000-0000-0000-000000000051', 'a0000001-0000-0000-0000-000000000023',
 'Hotel de la Poste Cortina', 4,
 'Storico hotel nel centro di Cortina, punto di ritrovo dell''élite alpina dal 1835. Stube tirolese con camino, strudel della casa e panorama sulle Tofane dalla terrazza.',
 'Cortina d''Ampezzo', 46.5368, 12.1390, true, true, false, false,
 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 260.00, true),

('c0000003-0000-0000-0000-000000000060', 'a0000001-0000-0000-0000-000000000023',
 'Baita Fraina Cortina', 3,
 'Baita alpina in legno e pietra immersa nei boschi a pochi minuti dal centro di Cortina. Camino nella sala comune, cucina ampezzana con canederli e silenzio delle Dolomiti.',
 'Cortina d''Ampezzo', 46.5320, 12.1420, true, false, true, false,
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 135.00, true);


-- ─── Availability for all new hotels (120 days) ────────────
INSERT INTO hotel_availability (id, hotel_id, date, rooms_available, price_night)
SELECT uuid_generate_v4(), h.id, (CURRENT_DATE + s.day_offset)::DATE,
  CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + s.day_offset) IN (5,6) THEN 3 ELSE 8 END,
  CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + s.day_offset) IN (5,6) THEN h.base_price_night * 1.20
       WHEN EXTRACT(MONTH FROM CURRENT_DATE + s.day_offset) IN (7,8) THEN h.base_price_night * 1.35
       ELSE h.base_price_night END
FROM hotels h CROSS JOIN generate_series(0, 119) AS s(day_offset)
WHERE h.id >= 'c0000003-0000-0000-0000-000000000016';
