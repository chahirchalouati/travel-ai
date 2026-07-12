-- V14: Seed test users and additional partners across Italy
-- Test users use a dummy bcrypt value (not loginable). The default ADMIN below
-- has a REAL bcrypt hash so a fresh database always has a working admin:
--   email: admin@travelai.it   password: Admin123!

-- ============================================================
-- 1. USERS (30 total: 25 TRAVELER, 3 PARTNER, 1 OPERATIONS, 1 ADMIN)
-- ============================================================
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, email_verified, active) VALUES
-- ADMIN
('f0000010-0000-0000-0000-000000000001', 'admin@travelai.it', '$2a$12$.UaqiuOY4qRsu0xi9jDDieTZTI6qdN478oy1uP0q7hpivKsdx/CpC', 'Marco', 'Bianchi', '+39 02 1234567', 'ADMIN', TRUE, TRUE),
-- OPERATIONS
('f0000010-0000-0000-0000-000000000002', 'ops@travelai.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Giulia', 'Rossi', '+39 06 7654321', 'OPERATIONS', TRUE, TRUE),
-- PARTNER users
('f0000010-0000-0000-0000-000000000003', 'luca.ferrari@partner.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Luca', 'Ferrari', '+39 011 2233445', 'PARTNER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000004', 'elena.moretti@partner.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Elena', 'Moretti', '+39 051 3344556', 'PARTNER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000005', 'antonio.esposito@partner.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Antonio', 'Esposito', '+39 081 4455667', 'PARTNER', TRUE, TRUE),
-- TRAVELER users
('f0000010-0000-0000-0000-000000000006', 'sofia.romano@gmail.com', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Sofia', 'Romano', '+39 333 1112233', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000007', 'alessandro.conti@libero.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Alessandro', 'Conti', '+39 347 2223344', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000008', 'chiara.ricci@gmail.com', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Chiara', 'Ricci', '+39 320 3334455', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000009', 'matteo.galli@yahoo.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Matteo', 'Galli', '+39 348 4445566', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000010', 'francesca.colombo@outlook.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Francesca', 'Colombo', '+39 339 5556677', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000011', 'davide.martini@gmail.com', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Davide', 'Martini', '+39 331 6667788', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000012', 'valentina.greco@libero.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Valentina', 'Greco', '+39 340 7778899', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000013', 'andrea.bruno@gmail.com', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Andrea', 'Bruno', '+39 328 8889900', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000014', 'laura.fontana@yahoo.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Laura', 'Fontana', '+39 345 9990011', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000015', 'giuseppe.leone@outlook.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Giuseppe', 'Leone', '+39 338 0001122', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000016', 'anna.mancini@gmail.com', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Anna', 'Mancini', '+39 329 1122334', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000017', 'lorenzo.pellegrini@libero.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Lorenzo', 'Pellegrini', '+39 346 2233445', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000018', 'martina.costa@gmail.com', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Martina', 'Costa', '+39 330 3344556', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000019', 'paolo.giordano@yahoo.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Paolo', 'Giordano', '+39 344 4455667', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000020', 'sara.vitale@outlook.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Sara', 'Vitale', '+39 335 5566778', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000021', 'roberto.deluca@gmail.com', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Roberto', 'De Luca', '+39 327 6677889', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000022', 'maria.battaglia@libero.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Maria', 'Battaglia', '+39 342 7788990', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000023', 'simone.caruso@gmail.com', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Simone', 'Caruso', '+39 336 8899001', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000024', 'elisa.serra@yahoo.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Elisa', 'Serra', '+39 349 9900112', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000025', 'federico.rinaldi@outlook.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Federico', 'Rinaldi', '+39 332 0011223', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000026', 'giorgia.santoro@gmail.com', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Giorgia', 'Santoro', '+39 341 1122334', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000027', 'stefano.fabbri@libero.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Stefano', 'Fabbri', '+39 337 2233445', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000028', 'claudia.mariani@gmail.com', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Claudia', 'Mariani', '+39 343 3344556', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000029', 'nicolas.villa@yahoo.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Nicolas', 'Villa', '+39 334 4455667', 'TRAVELER', TRUE, TRUE),
('f0000010-0000-0000-0000-000000000030', 'beatrice.gallo@outlook.it', '$2a$10$dummyHashForSeedDataOnly000000000000000000000000000000', 'Beatrice', 'Gallo', '+39 326 5566778', 'TRAVELER', TRUE, TRUE);

-- ============================================================
-- 2. PARTNERS
-- ============================================================

-- 2a. HOTELS (15 new, continuing from a0000001-...-000000000009)
INSERT INTO partners (id, user_id, type, name, vat_number, contact_email, contact_phone, address, city, country, latitude, longitude, status, quality_score, active) VALUES
('a0000001-0000-0000-0000-000000000009', 'f0000010-0000-0000-0000-000000000003', 'HOTEL', 'Grand Hotel Torino Palace', 'IT01234567890', 'info@torinograndpalace.it', '+39 011 5551234', 'Via Roma 28', 'Torino', 'ITA', 45.070312, 7.686856, 'LIVE', 4.65, TRUE),
('a0000001-0000-0000-0000-000000000010', NULL, 'HOTEL', 'Hotel Bologna Centro Storico', 'IT02345678901', 'prenotazioni@bolognacs.it', '+39 051 5552345', 'Via dell''Indipendenza 12', 'Bologna', 'ITA', 44.494887, 11.342616, 'LIVE', 4.42, TRUE),
('a0000001-0000-0000-0000-000000000011', NULL, 'HOTEL', 'Genova Porto Antico Hotel', 'IT03456789012', 'booking@genovaporto.it', '+39 010 5553456', 'Via al Porto Antico 6', 'Genova', 'ITA', 44.409920, 8.926340, 'LIVE', 4.18, TRUE),
('a0000001-0000-0000-0000-000000000012', NULL, 'HOTEL', 'Boutique Hotel Arena Verona', 'IT04567890123', 'info@hotelarenaverona.it', '+39 045 5554567', 'Piazza Bra 15', 'Verona', 'ITA', 45.438384, 10.993800, 'LIVE', 4.78, TRUE),
('a0000001-0000-0000-0000-000000000013', NULL, 'HOTEL', 'Hotel Catania Etna View', 'IT05678901234', 'reception@cataniaetna.it', '+39 095 5555678', 'Via Etnea 56', 'Catania', 'ITA', 37.502200, 15.087260, 'LIVE', 4.31, TRUE),
('a0000001-0000-0000-0000-000000000014', NULL, 'HOTEL', 'Bari Lungomare Hotel', 'IT06789012345', 'info@barilungomare.it', '+39 080 5556789', 'Lungomare Nazario Sauro 22', 'Bari', 'ITA', 41.117143, 16.871872, 'LIVE', 4.55, TRUE),
('a0000001-0000-0000-0000-000000000015', NULL, 'HOTEL', 'Hotel Perugia Citta della Domenica', 'IT07890123456', 'booking@perugiacity.it', '+39 075 5557890', 'Corso Vannucci 40', 'Perugia', 'ITA', 43.110700, 12.389700, 'LIVE', 3.95, TRUE),
('a0000001-0000-0000-0000-000000000016', NULL, 'HOTEL', 'Palazzo Lecce Suite', 'IT08901234567', 'info@palazzolecce.it', '+39 0832 558901', 'Via Augusto Imperatore 8', 'Lecce', 'ITA', 40.351500, 18.170200, 'LIVE', 4.82, TRUE),
('a0000001-0000-0000-0000-000000000017', NULL, 'HOTEL', 'Sassi Hotel Matera', 'IT09012345678', 'prenotazioni@sassimatera.it', '+39 0835 559012', 'Via dei Sassi 3', 'Matera', 'ITA', 40.666379, 16.611574, 'LIVE', 4.91, TRUE),
('a0000001-0000-0000-0000-000000000018', NULL, 'HOTEL', 'Hotel Tropea Mare Blu', 'IT10123456789', 'info@tropeamareblu.it', '+39 0963 560123', 'Via Lungomare 14', 'Tropea', 'ITA', 38.676700, 15.897600, 'LIVE', 4.47, TRUE),
('a0000001-0000-0000-0000-000000000019', NULL, 'HOTEL', 'Cinque Terre Cliff Hotel', 'IT11234567890', 'stay@cinqueterrecliff.it', '+39 0187 561234', 'Via Discovolo 230', 'Riomaggiore', 'ITA', 44.099660, 9.737860, 'LIVE', 4.73, TRUE),
('a0000001-0000-0000-0000-000000000020', NULL, 'HOTEL', 'Grand Hotel Como Lago', 'IT12345678901', 'info@comolago.it', '+39 031 562345', 'Lungo Lario Trieste 16', 'Como', 'ITA', 45.810670, 9.085180, 'LIVE', 4.88, TRUE),
('a0000001-0000-0000-0000-000000000021', NULL, 'HOTEL', 'Hotel Taormina Vista Mare', 'IT13456789012', 'booking@taorminavista.it', '+39 0942 563456', 'Corso Umberto I 45', 'Taormina', 'ITA', 37.852500, 15.288300, 'LIVE', 4.60, TRUE),
('a0000001-0000-0000-0000-000000000022', NULL, 'HOTEL', 'Sorrento Bellevue Palace', 'IT14567890123', 'info@sorrentobellevue.it', '+39 081 5644567', 'Piazza Tasso 10', 'Sorrento', 'ITA', 40.626300, 14.375800, 'LIVE', 4.52, TRUE),
('a0000001-0000-0000-0000-000000000023', NULL, 'HOTEL', 'Cortina Dolomiti Resort', 'IT15678901234', 'reception@cortinadolomiti.it', '+39 0436 565678', 'Corso Italia 92', 'Cortina d''Ampezzo', 'ITA', 46.536800, 12.135700, 'LIVE', 4.96, TRUE);

-- 2b. RESTAURANTS (15 new, continuing from b0000002-...-000000000006)
INSERT INTO partners (id, user_id, type, name, vat_number, contact_email, contact_phone, address, city, country, latitude, longitude, status, quality_score, active) VALUES
('b0000002-0000-0000-0000-000000000006', 'f0000010-0000-0000-0000-000000000004', 'RESTAURANT', 'Trattoria del Mole Torino', 'IT20123456789', 'info@trattoriamole.it', '+39 011 6661234', 'Via Po 18', 'Torino', 'ITA', 45.067600, 7.693800, 'LIVE', 4.35, TRUE),
('b0000002-0000-0000-0000-000000000007', NULL, 'RESTAURANT', 'Osteria Bolognese da Nino', 'IT21234567890', 'nino@osteriabolognese.it', '+39 051 6662345', 'Via Pescherie Vecchie 3', 'Bologna', 'ITA', 44.494100, 11.347200, 'LIVE', 4.71, TRUE),
('b0000002-0000-0000-0000-000000000008', NULL, 'RESTAURANT', 'Ristorante Porto di Genova', 'IT22345678901', 'info@portodigenova.it', '+39 010 6663456', 'Via San Lorenzo 24', 'Genova', 'ITA', 44.407300, 8.930600, 'LIVE', 4.22, TRUE),
('b0000002-0000-0000-0000-000000000009', NULL, 'RESTAURANT', 'Enoteca Veronese Classica', 'IT23456789012', 'info@enotecaveronese.it', '+39 045 6664567', 'Via Mazzini 11', 'Verona', 'ITA', 45.436800, 10.997100, 'LIVE', 4.58, TRUE),
('b0000002-0000-0000-0000-000000000010', NULL, 'RESTAURANT', 'Trattoria Catanese del Pesce', 'IT24567890123', 'info@cataneseseafood.it', '+39 095 6665678', 'Via Crociferi 30', 'Catania', 'ITA', 37.504700, 15.085100, 'LIVE', 4.15, TRUE),
('b0000002-0000-0000-0000-000000000011', NULL, 'RESTAURANT', 'La Cucina Barese', 'IT25678901234', 'info@cucinabarese.it', '+39 080 6666789', 'Via Sparano 42', 'Bari', 'ITA', 41.125700, 16.869900, 'LIVE', 4.44, TRUE),
('b0000002-0000-0000-0000-000000000012', NULL, 'RESTAURANT', 'Umbria Tavola Rustica', 'IT26789012345', 'info@umbriatavola.it', '+39 075 6667890', 'Via dei Priori 28', 'Perugia', 'ITA', 43.111800, 12.387300, 'LIVE', 3.89, TRUE),
('b0000002-0000-0000-0000-000000000013', NULL, 'RESTAURANT', 'Masseria Salentina Lecce', 'IT27890123456', 'info@masseriasalentina.it', '+39 0832 668901', 'Via Marco Basseo 5', 'Lecce', 'ITA', 40.353900, 18.173500, 'LIVE', 4.67, TRUE),
('b0000002-0000-0000-0000-000000000014', NULL, 'RESTAURANT', 'Grotta dei Sapori Matera', 'IT28901234567', 'info@grottasapori.it', '+39 0835 669012', 'Via Fiorentini 12', 'Matera', 'ITA', 40.664200, 16.613400, 'LIVE', 4.83, TRUE),
('b0000002-0000-0000-0000-000000000015', NULL, 'RESTAURANT', 'Ristorante Tropea al Tramonto', 'IT29012345678', 'info@tropeatramonto.it', '+39 0963 670123', 'Corso Vittorio Emanuele 8', 'Tropea', 'ITA', 38.678100, 15.896200, 'LIVE', 4.39, TRUE),
('b0000002-0000-0000-0000-000000000016', NULL, 'RESTAURANT', 'Trattoria delle Cinque Terre', 'IT30123456789', 'info@cinqueterretrattoria.it', '+39 0187 671234', 'Via Colombo 66', 'Manarola', 'ITA', 44.106900, 9.726700, 'LIVE', 4.50, TRUE),
('b0000002-0000-0000-0000-000000000017', NULL, 'RESTAURANT', 'Locanda Lario Como', 'IT31234567890', 'info@locandalario.it', '+39 031 672345', 'Piazza Cavour 3', 'Como', 'ITA', 45.811500, 9.083600, 'LIVE', 4.76, TRUE),
('b0000002-0000-0000-0000-000000000018', NULL, 'RESTAURANT', 'Taormina Gusto Siciliano', 'IT32345678901', 'info@taorminagusto.it', '+39 0942 673456', 'Via Teatro Greco 18', 'Taormina', 'ITA', 37.851800, 15.291700, 'LIVE', 4.28, TRUE),
('b0000002-0000-0000-0000-000000000019', NULL, 'RESTAURANT', 'Sorrento Sapori di Mare', 'IT33456789012', 'info@sorrentosapori.it', '+39 081 6744567', 'Via San Cesareo 50', 'Sorrento', 'ITA', 40.625400, 14.374900, 'LIVE', 4.62, TRUE),
('b0000002-0000-0000-0000-000000000020', NULL, 'RESTAURANT', 'Rifugio Cortina Gourmet', 'IT34567890123', 'info@cortinagourmet.it', '+39 0436 675678', 'Largo Poste 12', 'Cortina d''Ampezzo', 'ITA', 46.537200, 12.136800, 'LIVE', 4.55, TRUE);

-- 2c. CAR RENTAL (10 partners, IDs c1000003-...-000000000001 through ...000000000010)
INSERT INTO partners (id, user_id, type, name, vat_number, contact_email, contact_phone, address, city, country, latitude, longitude, status, quality_score, active) VALUES
('c1000003-0000-0000-0000-000000000001', 'f0000010-0000-0000-0000-000000000005', 'CAR_RENTAL', 'Roma Noleggio Auto Express', 'IT40123456789', 'info@romanoleggio.it', '+39 06 7771234', 'Via Cavour 88', 'Roma', 'ITA', 41.897800, 12.498900, 'LIVE', 4.12, TRUE),
('c1000003-0000-0000-0000-000000000002', NULL, 'CAR_RENTAL', 'Milano Auto Sprint', 'IT41234567890', 'noleggio@milanoautosprint.it', '+39 02 7772345', 'Viale Monza 120', 'Milano', 'ITA', 45.492300, 9.216700, 'LIVE', 4.33, TRUE),
('c1000003-0000-0000-0000-000000000003', NULL, 'CAR_RENTAL', 'Napoli Rent a Car Sud', 'IT42345678901', 'info@napolirent.it', '+39 081 7773456', 'Via Marina 45', 'Napoli', 'ITA', 40.845200, 14.266800, 'LIVE', 3.87, TRUE),
('c1000003-0000-0000-0000-000000000004', NULL, 'CAR_RENTAL', 'Firenze Autonoleggio Toscana', 'IT43456789012', 'info@firenzeauto.it', '+39 055 7774567', 'Viale Europa 22', 'Firenze', 'ITA', 43.769600, 11.255800, 'LIVE', 4.49, TRUE),
('c1000003-0000-0000-0000-000000000005', NULL, 'CAR_RENTAL', 'Palermo Wheels Sicilia', 'IT44567890123', 'info@palermowheels.it', '+39 091 7775678', 'Via Roma 210', 'Palermo', 'ITA', 38.115700, 13.361300, 'LIVE', 3.72, TRUE),
('c1000003-0000-0000-0000-000000000006', NULL, 'CAR_RENTAL', 'Catania Rent Drive', 'IT45678901234', 'info@cataniarentdrive.it', '+39 095 7776789', 'Via Plebiscito 60', 'Catania', 'ITA', 37.501300, 15.090800, 'LIVE', 4.05, TRUE),
('c1000003-0000-0000-0000-000000000007', NULL, 'CAR_RENTAL', 'Olbia Sardegna Car Hire', 'IT46789012345', 'info@olbiacarhire.it', '+39 0789 777890', 'Via Aldo Moro 5', 'Olbia', 'ITA', 40.923500, 9.497300, 'LIVE', 4.61, TRUE),
('c1000003-0000-0000-0000-000000000008', NULL, 'CAR_RENTAL', 'Venezia Terraferma Auto', 'IT47890123456', 'info@veneziaterraferma.it', '+39 041 7780123', 'Via Castellana 78', 'Mestre', 'ITA', 45.490300, 12.238500, 'LIVE', 3.98, TRUE),
('c1000003-0000-0000-0000-000000000009', NULL, 'CAR_RENTAL', 'Bologna Emilia Rent', 'IT48901234567', 'info@emiliarent.it', '+39 051 7791234', 'Via Stalingrado 35', 'Bologna', 'ITA', 44.506700, 11.352900, 'LIVE', 4.26, TRUE),
('c1000003-0000-0000-0000-000000000010', NULL, 'CAR_RENTAL', 'Torino Piemonte Noleggi', 'IT49012345678', 'info@piemontenoleggi.it', '+39 011 7802345', 'Corso Giulio Cesare 100', 'Torino', 'ITA', 45.088200, 7.695400, 'LIVE', 4.40, TRUE);

-- 2d. BEACH (8 partners, IDs d1000004-...-000000000001 through ...000000000008)
INSERT INTO partners (id, user_id, type, name, vat_number, contact_email, contact_phone, address, city, country, latitude, longitude, status, quality_score, active) VALUES
('d1000004-0000-0000-0000-000000000001', NULL, 'BEACH', 'Lido Tropea Spiaggia Bella', 'IT50123456789', 'info@lidotropea.it', '+39 0963 8881234', 'Spiaggia della Rotonda', 'Tropea', 'ITA', 38.674800, 15.894100, 'LIVE', 4.70, TRUE),
('d1000004-0000-0000-0000-000000000002', NULL, 'BEACH', 'Sardinia Beach Club Costa Smeralda', 'IT51234567890', 'info@sardbeachclub.it', '+39 0789 8882345', 'Spiaggia del Principe', 'Arzachena', 'ITA', 41.082500, 9.530800, 'LIVE', 4.92, TRUE),
('d1000004-0000-0000-0000-000000000003', NULL, 'BEACH', 'Amalfi Lido Paradiso', 'IT52345678901', 'info@amalfilido.it', '+39 089 8883456', 'Via Lungomare dei Cavalieri 2', 'Amalfi', 'ITA', 40.634200, 14.602500, 'LIVE', 4.58, TRUE),
('d1000004-0000-0000-0000-000000000004', NULL, 'BEACH', 'Sicilia Sun Beach Cefalu', 'IT53456789012', 'info@siciliasun.it', '+39 0921 8884567', 'Lungomare Giardina 10', 'Cefalu', 'ITA', 38.037400, 14.022400, 'LIVE', 4.34, TRUE),
('d1000004-0000-0000-0000-000000000005', NULL, 'BEACH', 'Puglia Mare Lido Polignano', 'IT54567890123', 'info@pugliamare.it', '+39 080 8885678', 'Lama Monachile', 'Polignano a Mare', 'ITA', 40.996700, 17.220200, 'LIVE', 4.81, TRUE),
('d1000004-0000-0000-0000-000000000006', NULL, 'BEACH', 'Bagni Liguria Levante', 'IT55678901234', 'info@bagniliguria.it', '+39 0185 8886789', 'Via XXV Aprile 18', 'Sestri Levante', 'ITA', 44.271200, 9.394000, 'LIVE', 4.16, TRUE),
('d1000004-0000-0000-0000-000000000007', NULL, 'BEACH', 'Elba Island Beach Resort', 'IT56789012345', 'info@elbabeach.it', '+39 0565 8887890', 'Spiaggia di Cavoli', 'Marina di Campo', 'ITA', 42.735800, 10.173700, 'LIVE', 4.43, TRUE),
('d1000004-0000-0000-0000-000000000008', NULL, 'BEACH', 'Rimini Riviera Beach Club', 'IT57890123456', 'info@riminiriviera.it', '+39 0541 8888901', 'Lungomare Tintori 22', 'Rimini', 'ITA', 44.060500, 12.572800, 'LIVE', 3.95, TRUE);

-- 2e. OTHER (5 partners: tour operators, activity providers)
INSERT INTO partners (id, user_id, type, name, vat_number, contact_email, contact_phone, address, city, country, latitude, longitude, status, quality_score, active) VALUES
('e1000005-0000-0000-0000-000000000001', NULL, 'OTHER', 'Vesuvio Adventure Tours', 'IT60123456789', 'info@vesuviotours.it', '+39 081 9991234', 'Via Vesuvio 15', 'Ercolano', 'ITA', 40.806100, 14.348200, 'LIVE', 4.37, TRUE),
('e1000005-0000-0000-0000-000000000002', NULL, 'OTHER', 'Toscana Wine & Bike Experience', 'IT61234567890', 'info@toscanawine.it', '+39 0577 9992345', 'Via di Citta 44', 'Siena', 'ITA', 43.318700, 11.331500, 'LIVE', 4.74, TRUE),
('e1000005-0000-0000-0000-000000000003', NULL, 'OTHER', 'Venezia Gondola & Walking Tours', 'IT62345678901', 'info@veneziagondola.it', '+39 041 9993456', 'Campo San Polo 2101', 'Venezia', 'ITA', 45.436500, 12.331200, 'LIVE', 4.52, TRUE),
('e1000005-0000-0000-0000-000000000004', NULL, 'OTHER', 'Dolomiti Ski & Trekking Club', 'IT63456789012', 'info@dolomiticlub.it', '+39 0471 9994567', 'Piazza Walther 8', 'Bolzano', 'ITA', 46.498300, 11.354600, 'LIVE', 4.89, TRUE),
('e1000005-0000-0000-0000-000000000005', NULL, 'OTHER', 'Costiera Amalfitana Boat Excursions', 'IT64567890123', 'info@costieraboat.it', '+39 089 9995678', 'Via Cristoforo Colombo 20', 'Positano', 'ITA', 40.628000, 14.484500, 'LIVE', 4.63, TRUE);
