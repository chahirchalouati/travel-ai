import { Component, computed, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import { switchMap, forkJoin, of, catchError, timer, take, first } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TravelService } from '../../core/services/travel.service';
import { CatalogService } from '../../core/services/catalog.service';
import { BookingService } from '../../core/services/booking.service';
import { PaymentService } from '../../core/services/payment.service';
import { PlannerMapComponent, PlannerPin } from './planner-map.component';

// ─── Types ───────────────────────────────────────────────────────────────────

type Lang = 'it' | 'en' | 'fr' | 'es';
type Stage = 'empty' | 'generating' | 'results' | 'detail';
type Overlay = null | 'booking' | 'payment' | 'confirmation' | 'concierge';
type Priority = 'food' | 'stay' | 'bal';
type DateMode = 'fixed' | 'flex';

interface Strings {
  restart: string;
  i_title: string; i_sub: string; i_budget: string; i_required: string; i_total: string;
  i_dates: string; i_fixed: string; i_flex: string; i_nights: string;
  i_people: string; i_adults: string; i_children: string; i_optional: string;
  i_priority: string; i_priority_sub: string; i_constraints: string;
  prio_food: string; prio_stay: string; prio_bal: string;
  c_sea: string; c_pets: string; c_access: string; c_family: string;
  dest_open_t: string; dest_open_s: string; dest_set_t: string; dest_set_s: string;
  gen: string; gen_again: string;
  e_title: string; e_sub: string;
  g_title: string; g_sub: string; g_foot: string;
  ag_orch: string; ag_orch_t: string; ag_hotel: string; ag_hotel_t: string;
  ag_rest: string; ag_rest_t: string; ag_flight: string; ag_flight_t: string;
  ag_rank: string; ag_rank_t: string;
  r_title: string; r_recommended: string; r_view: string; r_regen: string;
  fit_in: string; fit_over: string;
  d_back: string; d_breakdown: string; d_vs_budget: string; d_ideal: string;
  d_elements: string; d_change: string; d_book: string;
  b_title: string; b_checking: string; b_traveler: string; b_summary: string;
  b_total: string; b_continue: string; b_wait: string;
  p_title: string; p_paying: string; p_how: string; p_full: string; p_full_sub: string;
  p_install: string; p_plan: string; p_now: string; p_platform: string;
  p_pay_full: string; p_pay_install: string;
  c_title: string; c_sub: string; c_concierge: string; c_concierge_sub: string;
  c_open: string; c_restart: string; concept: string;
  cc_title: string; cc_context: string; cc_suggestion: string; cc_placeholder: string;
  cc_greet: string; cc_user: string; cc_reply: string;
  cc_offer_badge: string; cc_offer_title: string; cc_offer_sub: string; cc_offer_cta: string;
  cc_booked: string;
  st_plan: string; st_proposals: string; st_detail: string; st_book: string;
  sign_out: string; sign_in: string;
  pill_hotel: string; pill_restaurants: string; pill_flight: string;
  auth_sign_in: string; auth_register: string; auth_first_name: string; auth_last_name: string;
  auth_password_placeholder: string; auth_loading: string; auth_create: string;
  auth_email_required: string; auth_fields_required: string;
  auth_invalid: string; auth_register_error: string;
  auth_first_placeholder: string; auth_last_placeholder: string;
  check_restaurants: string; check_flight: string; check_available: string; check_checking: string;
  tr_adults: string; tr_children: string;
  rs_nights: string; rs_ppl: string;
  rs_prio_food: string; rs_prio_stay: string; rs_prio_bal: string;
  install_sub: string;
  conf_hotel: string; conf_restaurants: string; conf_flight: string;
  rest_recommended: string; flight_roundtrip: string; proposal_why_default: string;
  hotel_sea: string; local_cuisine: string; bag_included: string; carry_on: string; free_cancel: string;
  per_person: string; under_budget: string;
  split_stay: string; split_food: string; split_transport: string;
}

const STR: Record<Lang, Strings> = {
  it: {
    restart:'Riavvia',
    i_title:'Pianifica il viaggio', i_sub:'Imposta i parametri, l\u2019AI fa il resto', i_budget:'Budget', i_required:'obbligatorio', i_total:'totale', i_dates:'Date', i_fixed:'Fisse', i_flex:'Flessibili \xb13g', i_nights:'Notti', i_people:'Viaggiatori', i_adults:'Adulti', i_children:'Bambini', i_optional:'opzionale', i_priority:'Priorit\xe0 di spesa', i_priority_sub:'Su cosa preferisci spendere di pi\xf9?', i_constraints:'Vincoli',
    prio_food:'Cibo', prio_stay:'Alloggio', prio_bal:'Bilanciato',
    c_sea:'Mare', c_pets:'Animali', c_access:'Accessibile', c_family:'Famiglie',
    dest_open_t:'Destinazione aperta', dest_open_s:'L\u2019AI sceglie in base al budget', dest_set_t:'Citt\xe0 di mare', dest_set_s:'Suggerita dall\u2019AI \xb7 clic per riaprire',
    gen:'Genera proposte AI', gen_again:'Rigenera proposte',
    e_title:'Pronto a comporre il tuo viaggio', e_sub:'Imposta budget, date e priorit\xe0 nel pannello a sinistra, poi genera. L\u2019AI compone 2\u20133 pacchetti completi \u2014 hotel, ristoranti e volo \u2014 entro il tuo budget.',
    g_title:'Sto componendo il tuo viaggio', g_sub:'Gli agenti AI cercano in parallelo', g_foot:'agenti proprietari \xb7 rate-limited \xb7 budget-aware',
    ag_orch:'Agente Orchestratore', ag_orch_t:'Normalizza input e budget', ag_hotel:'Agente Hotel', ag_hotel_t:'Strutture compatibili nel DB', ag_rest:'Agente Ristoranti', ag_rest_t:'Partner diretti in zona', ag_flight:'Agente Voli', ag_flight_t:'Voli nel budget residuo', ag_rank:'Agente di Ranking', ag_rank_t:'Compone 2\u20133 pacchetti coerenti',
    r_title:'Le tue proposte', r_recommended:'Consigliata', r_view:'Dettaglio', r_regen:'Nuove proposte', fit_in:'in budget', fit_over:'oltre budget',
    d_back:'Torna alle proposte', d_breakdown:'Ripartizione budget', d_vs_budget:'sul tuo budget', d_ideal:'Ripartizione ideale per le tue priorit\xe0', d_elements:'Componenti del viaggio', d_change:'Cambia', d_book:'Prenota',
    b_title:'Prenotazione', b_checking:'Disponibilit\xe0 in tempo reale', b_traveler:'Viaggiatore', b_summary:'Riepilogo costi', b_total:'Totale', b_continue:'Vai al pagamento', b_wait:'Verifica disponibilit\xe0\u2026',
    p_title:'Pagamento', p_paying:'Stai pagando', p_how:'Come vuoi pagare', p_full:'Saldo unico', p_full_sub:'Paga tutto adesso', p_install:'Pagamento rateale', p_plan:'Piano in 3 rate', p_now:'Oggi', p_platform:'La piattaforma incassa l\u2019intero importo subito, anche con rate: il rischio insoluto resta al gateway, mai alle strutture.', p_pay_full:'Paga \u20ac', p_pay_install:'Attiva Klarna \xb7 \u20ac',
    c_title:'Viaggio confermato!', c_sub:'Prenotazioni inviate, conferme in arrivo via email.', c_concierge:'Travel Concierge', c_concierge_sub:'La tua assistente AI durante il soggiorno. Si attiva 3 giorni prima della partenza.', c_open:'Apri il Concierge (demo)', c_restart:'Ricomincia il flusso', concept:'CONCEPT',
    cc_title:'Concierge AI', cc_context:'Conosco gi\xe0 il tuo viaggio: hotel, date e gruppo. Chiedimi pure in linguaggio naturale.', cc_suggestion:'Trovami un tavolo per stasera vicino all\u2019hotel', cc_placeholder:'Scrivi una richiesta\u2026',
    cc_greet:'Ciao Marco! Sono il tuo Concierge per Amalfi. Posso aiutarti con tavoli, transfer o attivit\xe0 last-minute durante il soggiorno.',
    cc_user:'Trovami un tavolo per stasera vicino all\u2019hotel', cc_reply:'Ho trovato un ristorante partner a 4 minuti a piedi dal tuo hotel, con disponibilit\xe0 per 2 stasera alle 20:30.',
    cc_offer_badge:'Partner diretto', cc_offer_title:'Trattoria del Mare', cc_offer_sub:'2 persone \xb7 20:30 \xb7 4 min a piedi \xb7 prenotabile in app', cc_offer_cta:'Prenota il tavolo', cc_booked:'Fatto! Tavolo prenotato per stasera alle 20:30. Conferma inviata.',
    st_plan:'Pianifica', st_proposals:'Proposte', st_detail:'Dettaglio', st_book:'Checkout',
    sign_out:'Esci', sign_in:'Accedi',
    pill_hotel:'Hotel', pill_restaurants:'Ristoranti', pill_flight:'Volo',
    auth_sign_in:'Accedi', auth_register:'Registrati', auth_first_name:'Nome', auth_last_name:'Cognome',
    auth_password_placeholder:'Almeno 8 caratteri', auth_loading:'Caricamento...', auth_create:'Crea account',
    auth_email_required:'Inserisci email e password.', auth_fields_required:'Compila tutti i campi.',
    auth_invalid:'Credenziali non valide.', auth_register_error:'Errore durante la registrazione.',
    auth_first_placeholder:'Marco', auth_last_placeholder:'Bianchi',
    check_restaurants:'Ristoranti partner', check_flight:'Volo A/R', check_available:'Disponibile', check_checking:'Verifica…',
    tr_adults:'adulti', tr_children:'bambini',
    rs_nights:'notti', rs_ppl:'pers.',
    rs_prio_food:'priorit\xe0 cibo', rs_prio_stay:'priorit\xe0 alloggio', rs_prio_bal:'bilanciato',
    install_sub:'3 rate da €',
    conf_hotel:'Hotel prenotato', conf_restaurants:'Ristoranti confermati', conf_flight:'Volo emesso',
    rest_recommended:'Ristoranti consigliati', flight_roundtrip:'Volo A/R', proposal_why_default:'Proposta ottimizzata per le tue preferenze.',
    hotel_sea:' \xb7 mare', local_cuisine:'Cucina locale', bag_included:'Bagaglio incluso', carry_on:'Bagaglio a mano', free_cancel:'Cancellazione gratuita fino a 7 giorni prima.',
    per_person:'a persona', under_budget:'sotto budget · ',
    split_stay:'Alloggio', split_food:'Cibo', split_transport:'Trasporti',
  },
  en: {
    restart:'Restart',
    i_title:'Plan the trip', i_sub:'Set the parameters, the AI does the rest', i_budget:'Budget', i_required:'required', i_total:'total', i_dates:'Dates', i_fixed:'Fixed', i_flex:'Flexible \xb13d', i_nights:'Nights', i_people:'Travellers', i_adults:'Adults', i_children:'Children', i_optional:'optional', i_priority:'Spending priority', i_priority_sub:'Where would you rather spend more?', i_constraints:'Constraints',
    prio_food:'Food', prio_stay:'Stay', prio_bal:'Balanced',
    c_sea:'Sea', c_pets:'Pets', c_access:'Accessible', c_family:'Family',
    dest_open_t:'Open destination', dest_open_s:'AI picks based on your budget', dest_set_t:'Seaside city', dest_set_s:'Suggested by AI \xb7 click to reopen',
    gen:'Generate AI proposals', gen_again:'Regenerate proposals',
    e_title:'Ready to compose your trip', e_sub:'Set budget, dates and priorities in the left panel, then generate. The AI builds 2\u20133 complete packages \u2014 hotel, restaurants and flight \u2014 within your budget.',
    g_title:'Composing your trip', g_sub:'AI agents searching in parallel', g_foot:'proprietary agents \xb7 rate-limited \xb7 budget-aware',
    ag_orch:'Orchestrator Agent', ag_orch_t:'Normalising input & budget', ag_hotel:'Hotel Agent', ag_hotel_t:'Matching stays in the DB', ag_rest:'Restaurant Agent', ag_rest_t:'Direct partners in the area', ag_flight:'Flight Agent', ag_flight_t:'Flights within remaining budget', ag_rank:'Ranking Agent', ag_rank_t:'Builds 2\u20133 coherent packages',
    r_title:'Your proposals', r_recommended:'Recommended', r_view:'Detail', r_regen:'New proposals', fit_in:'in budget', fit_over:'over budget',
    d_back:'Back to proposals', d_breakdown:'Budget breakdown', d_vs_budget:'of your budget', d_ideal:'Ideal split for your priorities', d_elements:'Trip components', d_change:'Change', d_book:'Book',
    b_title:'Booking', b_checking:'Real-time availability', b_traveler:'Traveller', b_summary:'Cost summary', b_total:'Total', b_continue:'Go to payment', b_wait:'Checking availability\u2026',
    p_title:'Payment', p_paying:'You\u2019re paying', p_how:'How would you like to pay', p_full:'Pay in full', p_full_sub:'Pay everything now', p_install:'Pay in instalments', p_plan:'3-instalment plan', p_now:'Today', p_platform:'The platform collects the full amount immediately, even on instalments: default risk stays with the gateway, never the partners.', p_pay_full:'Pay \u20ac', p_pay_install:'Start Klarna \xb7 \u20ac',
    c_title:'Trip confirmed!', c_sub:'Bookings sent, confirmations on their way by email.', c_concierge:'Travel Concierge', c_concierge_sub:'Your in-stay AI assistant. It unlocks 3 days before departure.', c_open:'Open Concierge (demo)', c_restart:'Restart the flow', concept:'CONCEPT',
    cc_title:'Concierge AI', cc_context:'I already know your trip: hotel, dates and group. Just ask in plain language.', cc_suggestion:'Find me a table tonight near the hotel', cc_placeholder:'Type a request\u2026',
    cc_greet:'Hi Marco! I\u2019m your Concierge for Amalfi. I can help with tables, transfers or last-minute activities during your stay.',
    cc_user:'Find me a table tonight near the hotel', cc_reply:'I found a partner restaurant a 4-minute walk from your hotel, with availability for 2 tonight at 8:30 pm.',
    cc_offer_badge:'Direct partner', cc_offer_title:'Trattoria del Mare', cc_offer_sub:'2 people \xb7 8:30 pm \xb7 4 min walk \xb7 bookable in app', cc_offer_cta:'Book the table', cc_booked:'Done! Table booked for tonight at 8:30 pm. Confirmation sent.',
    st_plan:'Plan', st_proposals:'Proposals', st_detail:'Detail', st_book:'Checkout',
    sign_out:'Sign out', sign_in:'Sign in',
    pill_hotel:'Hotel', pill_restaurants:'Restaurants', pill_flight:'Flight',
    auth_sign_in:'Sign in', auth_register:'Register', auth_first_name:'First name', auth_last_name:'Last name',
    auth_password_placeholder:'At least 8 characters', auth_loading:'Loading...', auth_create:'Create account',
    auth_email_required:'Enter your email and password.', auth_fields_required:'Please fill in all fields.',
    auth_invalid:'Invalid credentials.', auth_register_error:'Registration failed.',
    auth_first_placeholder:'John', auth_last_placeholder:'Doe',
    check_restaurants:'Partner restaurants', check_flight:'Round-trip flight', check_available:'Available', check_checking:'Checking…',
    tr_adults:'adults', tr_children:'children',
    rs_nights:'nights', rs_ppl:'ppl',
    rs_prio_food:'food priority', rs_prio_stay:'stay priority', rs_prio_bal:'balanced',
    install_sub:'3 payments of €',
    conf_hotel:'Hotel booked', conf_restaurants:'Restaurants confirmed', conf_flight:'Flight issued',
    rest_recommended:'Recommended restaurants', flight_roundtrip:'Round-trip', proposal_why_default:'Optimised for your preferences.',
    hotel_sea:' \xb7 sea', local_cuisine:'Local cuisine', bag_included:'Bag included', carry_on:'Carry-on', free_cancel:'Free cancellation up to 7 days before.',
    per_person:'per person', under_budget:'under budget · ',
    split_stay:'Stay', split_food:'Food', split_transport:'Transport',
  },
  fr: {
    restart:'Redémarrer',
    i_title:'Planifiez le voyage', i_sub:'Définissez les paramètres, l\u2019IA fait le reste', i_budget:'Budget', i_required:'obligatoire', i_total:'total', i_dates:'Dates', i_fixed:'Fixes', i_flex:'Flexibles \xb13j', i_nights:'Nuits', i_people:'Voyageurs', i_adults:'Adultes', i_children:'Enfants', i_optional:'optionnel', i_priority:'Priorité de dépense', i_priority_sub:'Sur quoi préférez-vous dépenser plus ?', i_constraints:'Contraintes',
    prio_food:'Gastronomie', prio_stay:'Hébergement', prio_bal:'Équilibré',
    c_sea:'Mer', c_pets:'Animaux', c_access:'Accessible', c_family:'Familles',
    dest_open_t:'Destination ouverte', dest_open_s:'L\u2019IA choisit selon votre budget', dest_set_t:'Ville côtière', dest_set_s:'Suggérée par l\u2019IA \xb7 cliquez pour rouvrir',
    gen:'Générer des propositions IA', gen_again:'Régénérer les propositions',
    e_title:'Prêt à composer votre voyage', e_sub:'Définissez budget, dates et priorités dans le panneau de gauche, puis générez. L\u2019IA compose 2\u20133 forfaits complets \u2014 hôtel, restaurants et vol \u2014 dans votre budget.',
    g_title:'Je compose votre voyage', g_sub:'Les agents IA recherchent en parallèle', g_foot:'agents propriétaires \xb7 cadencés \xb7 budget-aware',
    ag_orch:'Agent Orchestrateur', ag_orch_t:'Normalise les entrées et le budget', ag_hotel:'Agent Hôtel', ag_hotel_t:'Hébergements compatibles en BDD', ag_rest:'Agent Restaurants', ag_rest_t:'Partenaires directs dans la zone', ag_flight:'Agent Vols', ag_flight_t:'Vols dans le budget restant', ag_rank:'Agent de Classement', ag_rank_t:'Compose 2\u20133 forfaits cohérents',
    r_title:'Vos propositions', r_recommended:'Recommandé', r_view:'Détail', r_regen:'Nouvelles propositions', fit_in:'dans le budget', fit_over:'hors budget',
    d_back:'Retour aux propositions', d_breakdown:'Répartition du budget', d_vs_budget:'de votre budget', d_ideal:'Répartition idéale selon vos priorités', d_elements:'Composants du voyage', d_change:'Changer', d_book:'Réserver',
    b_title:'Réservation', b_checking:'Disponibilité en temps réel', b_traveler:'Voyageur', b_summary:'Résumé des coûts', b_total:'Total', b_continue:'Passer au paiement', b_wait:'Vérification de la disponibilité\u2026',
    p_title:'Paiement', p_paying:'Vous payez', p_how:'Comment souhaitez-vous payer', p_full:'Paiement intégral', p_full_sub:'Payez tout maintenant', p_install:'Paiement échelonné', p_plan:'Plan en 3 versements', p_now:'Aujourd\u2019hui', p_platform:'La plateforme encaisse la totalité immédiatement, même en versements : le risque d\u2019impayé reste au gateway, jamais aux partenaires.', p_pay_full:'Payer \u20ac', p_pay_install:'Activer Klarna \xb7 \u20ac',
    c_title:'Voyage confirmé !', c_sub:'Réservations envoyées, confirmations en route par email.', c_concierge:'Travel Concierge', c_concierge_sub:'Votre assistant IA pendant le séjour. Il s\u2019active 3 jours avant le départ.', c_open:'Ouvrir le Concierge (démo)', c_restart:'Recommencer le flux', concept:'CONCEPT',
    cc_title:'Concierge IA', cc_context:'Je connais déjà votre voyage : hôtel, dates et groupe. Demandez-moi en langage naturel.', cc_suggestion:'Trouvez-moi une table ce soir près de l\u2019hôtel', cc_placeholder:'Écrivez une demande\u2026',
    cc_greet:'Bonjour Marco ! Je suis votre Concierge pour Amalfi. Je peux vous aider avec les tables, transferts ou activités de dernière minute pendant votre séjour.',
    cc_user:'Trouvez-moi une table ce soir près de l\u2019hôtel', cc_reply:'J\u2019ai trouvé un restaurant partenaire à 4 minutes à pied de votre hôtel, avec disponibilité pour 2 ce soir à 20h30.',
    cc_offer_badge:'Partenaire direct', cc_offer_title:'Trattoria del Mare', cc_offer_sub:'2 personnes \xb7 20h30 \xb7 4 min à pied \xb7 réservable dans l\u2019app', cc_offer_cta:'Réserver la table', cc_booked:'C\u2019est fait ! Table réservée pour ce soir à 20h30. Confirmation envoyée.',
    st_plan:'Planifier', st_proposals:'Propositions', st_detail:'Détail', st_book:'Paiement',
    sign_out:'Déconnexion', sign_in:'Se connecter',
    pill_hotel:'Hôtel', pill_restaurants:'Restaurants', pill_flight:'Vol',
    auth_sign_in:'Se connecter', auth_register:'S\u2019inscrire', auth_first_name:'Prénom', auth_last_name:'Nom',
    auth_password_placeholder:'Au moins 8 caractères', auth_loading:'Chargement...', auth_create:'Créer un compte',
    auth_email_required:'Saisissez votre email et mot de passe.', auth_fields_required:'Veuillez remplir tous les champs.',
    auth_invalid:'Identifiants invalides.', auth_register_error:'Échec de l\u2019inscription.',
    auth_first_placeholder:'Jean', auth_last_placeholder:'Dupont',
    check_restaurants:'Restaurants partenaires', check_flight:'Vol A/R', check_available:'Disponible', check_checking:'V\xe9rification…',
    tr_adults:'adultes', tr_children:'enfants',
    rs_nights:'nuits', rs_ppl:'pers.',
    rs_prio_food:'priorit\xe9 gastronomie', rs_prio_stay:'priorit\xe9 h\xe9bergement', rs_prio_bal:'\xe9quilibr\xe9',
    install_sub:'3 versements de €',
    conf_hotel:'H\xf4tel r\xe9serv\xe9', conf_restaurants:'Restaurants confirm\xe9s', conf_flight:'Vol \xe9mis',
    rest_recommended:'Restaurants recommand\xe9s', flight_roundtrip:'Vol A/R', proposal_why_default:'Optimis\xe9 pour vos pr\xe9f\xe9rences.',
    hotel_sea:' \xb7 mer', local_cuisine:'Cuisine locale', bag_included:'Bagage inclus', carry_on:'Bagage cabine', free_cancel:'Annulation gratuite jusqu\u2019\xe0 7 jours avant.',
    per_person:'par personne', under_budget:'sous le budget \xb7 ',
    split_stay:'H\xe9bergement', split_food:'Gastronomie', split_transport:'Transports',
  },
  es: {
    restart:'Reiniciar',
    i_title:'Planifica el viaje', i_sub:'Configura los parámetros, la IA hace el resto', i_budget:'Presupuesto', i_required:'obligatorio', i_total:'total', i_dates:'Fechas', i_fixed:'Fijas', i_flex:'Flexibles \xb13d', i_nights:'Noches', i_people:'Viajeros', i_adults:'Adultos', i_children:'Niños', i_optional:'opcional', i_priority:'Prioridad de gasto', i_priority_sub:'¿En qué prefieres gastar más?', i_constraints:'Restricciones',
    prio_food:'Gastronomía', prio_stay:'Alojamiento', prio_bal:'Equilibrado',
    c_sea:'Mar', c_pets:'Mascotas', c_access:'Accesible', c_family:'Familias',
    dest_open_t:'Destino abierto', dest_open_s:'La IA elige según tu presupuesto', dest_set_t:'Ciudad costera', dest_set_s:'Sugerida por la IA \xb7 haz clic para reabrir',
    gen:'Generar propuestas IA', gen_again:'Regenerar propuestas',
    e_title:'Listo para componer tu viaje', e_sub:'Configura presupuesto, fechas y prioridades en el panel izquierdo, luego genera. La IA compone 2\u20133 paquetes completos \u2014 hotel, restaurantes y vuelo \u2014 dentro de tu presupuesto.',
    g_title:'Componiendo tu viaje', g_sub:'Los agentes IA buscan en paralelo', g_foot:'agentes propietarios \xb7 con límites \xb7 budget-aware',
    ag_orch:'Agente Orquestador', ag_orch_t:'Normaliza entradas y presupuesto', ag_hotel:'Agente Hotel', ag_hotel_t:'Alojamientos compatibles en la BDD', ag_rest:'Agente Restaurantes', ag_rest_t:'Socios directos en la zona', ag_flight:'Agente Vuelos', ag_flight_t:'Vuelos en el presupuesto restante', ag_rank:'Agente de Ranking', ag_rank_t:'Compone 2\u20133 paquetes coherentes',
    r_title:'Tus propuestas', r_recommended:'Recomendada', r_view:'Detalle', r_regen:'Nuevas propuestas', fit_in:'dentro del presupuesto', fit_over:'fuera del presupuesto',
    d_back:'Volver a propuestas', d_breakdown:'Desglose del presupuesto', d_vs_budget:'de tu presupuesto', d_ideal:'Desglose ideal según tus prioridades', d_elements:'Componentes del viaje', d_change:'Cambiar', d_book:'Reservar',
    b_title:'Reserva', b_checking:'Disponibilidad en tiempo real', b_traveler:'Viajero', b_summary:'Resumen de costes', b_total:'Total', b_continue:'Ir al pago', b_wait:'Verificando disponibilidad\u2026',
    p_title:'Pago', p_paying:'Estás pagando', p_how:'¿Cómo quieres pagar?', p_full:'Pago único', p_full_sub:'Paga todo ahora', p_install:'Pago a plazos', p_plan:'Plan en 3 cuotas', p_now:'Hoy', p_platform:'La plataforma cobra el importe total de inmediato, incluso a plazos: el riesgo de impago queda en el gateway, nunca en los socios.', p_pay_full:'Pagar \u20ac', p_pay_install:'Activar Klarna \xb7 \u20ac',
    c_title:'¡Viaje confirmado!', c_sub:'Reservas enviadas, confirmaciones en camino por email.', c_concierge:'Travel Concierge', c_concierge_sub:'Tu asistente IA durante la estancia. Se activa 3 días antes de la salida.', c_open:'Abrir Concierge (demo)', c_restart:'Reiniciar el flujo', concept:'CONCEPT',
    cc_title:'Concierge IA', cc_context:'Ya conozco tu viaje: hotel, fechas y grupo. Pregúntame en lenguaje natural.', cc_suggestion:'Encuéntrame una mesa esta noche cerca del hotel', cc_placeholder:'Escribe una solicitud\u2026',
    cc_greet:'¡Hola Marco! Soy tu Concierge para Amalfi. Puedo ayudarte con mesas, traslados o actividades de último momento durante tu estancia.',
    cc_user:'Encuéntrame una mesa esta noche cerca del hotel', cc_reply:'He encontrado un restaurante socio a 4 minutos a pie de tu hotel, con disponibilidad para 2 esta noche a las 20:30.',
    cc_offer_badge:'Socio directo', cc_offer_title:'Trattoria del Mare', cc_offer_sub:'2 personas \xb7 20:30 \xb7 4 min a pie \xb7 reservable en la app', cc_offer_cta:'Reservar la mesa', cc_booked:'¡Hecho! Mesa reservada para esta noche a las 20:30. Confirmación enviada.',
    st_plan:'Planificar', st_proposals:'Propuestas', st_detail:'Detalle', st_book:'Pago',
    sign_out:'Cerrar sesión', sign_in:'Iniciar sesión',
    pill_hotel:'Hotel', pill_restaurants:'Restaurantes', pill_flight:'Vuelo',
    auth_sign_in:'Iniciar sesión', auth_register:'Registrarse', auth_first_name:'Nombre', auth_last_name:'Apellido',
    auth_password_placeholder:'Al menos 8 caracteres', auth_loading:'Cargando...', auth_create:'Crear cuenta',
    auth_email_required:'Ingresa tu email y contraseña.', auth_fields_required:'Por favor completa todos los campos.',
    auth_invalid:'Credenciales inválidas.', auth_register_error:'Error en el registro.',
    auth_first_placeholder:'Juan', auth_last_placeholder:'Garc\xeda',
    check_restaurants:'Restaurantes socios', check_flight:'Vuelo ida y vuelta', check_available:'Disponible', check_checking:'Verificando…',
    tr_adults:'adultos', tr_children:'ni\xf1os',
    rs_nights:'noches', rs_ppl:'pers.',
    rs_prio_food:'prioridad gastronom\xeda', rs_prio_stay:'prioridad alojamiento', rs_prio_bal:'equilibrado',
    install_sub:'3 pagos de €',
    conf_hotel:'Hotel reservado', conf_restaurants:'Restaurantes confirmados', conf_flight:'Vuelo emitido',
    rest_recommended:'Restaurantes recomendados', flight_roundtrip:'Vuelo ida y vuelta', proposal_why_default:'Optimizado para tus preferencias.',
    hotel_sea:' \xb7 mar', local_cuisine:'Cocina local', bag_included:'Equipaje incluido', carry_on:'Equipaje de mano', free_cancel:'Cancelaci\xf3n gratuita hasta 7 d\xedas antes.',
    per_person:'por persona', under_budget:'dentro del presupuesto · ',
    split_stay:'Alojamiento', split_food:'Gastronom\xeda', split_transport:'Transportes',
  }
};

const IMG = {
  amalfi:  'url(https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=700&q=80) center/cover no-repeat',
  cinque:  'url(https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=700&q=80) center/cover no-repeat',
  sardegna:'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80) center/cover no-repeat',
  roma:    'url(https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=700&q=80) center/cover no-repeat',
  sicilia: 'url(https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=700&q=80) center/cover no-repeat',
  puglia:  'url(https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=700&q=80) center/cover no-repeat',
  venezia: 'url(https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=700&q=80) center/cover no-repeat',
  firenze: 'url(https://images.unsplash.com/photo-1476900164809-ff19b8ae5968?w=700&q=80) center/cover no-repeat',
  napoli:  'url(https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=700&q=80) center/cover no-repeat',
  capri:   'url(https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=700&q=80) center/cover no-repeat',
  positano:'url(https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=700&q=80) center/cover no-repeat',
  matera:  'url(https://images.unsplash.com/photo-1601379327928-bedfaf9da2d0?w=700&q=80) center/cover no-repeat',
  table:   'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80) center/cover no-repeat',
};

function fmt(n: number, lang: Lang): string {
  const sep = lang === 'en' ? ',' : '.';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

// ─── Live-planning timing ──────────────────────────────────────────────────────
// Proposal generation is LLM-bound (the backend writes an AI motivation per
// package), so it can take ~8–20s+ and is variable. The poll window must be
// generous enough that live results reliably land before we fall back to demo.
const PLANNER_POLL_INTERVAL_MS = 2000;
const PLANNER_POLL_MAX_ATTEMPTS = 30; // 30 × 2s = 60s live-generation window
const PLANNER_GENERATION_TIMEOUT_MS =
  PLANNER_POLL_INTERVAL_MS * PLANNER_POLL_MAX_ATTEMPTS;

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, PlannerMapComponent],
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss'
})
export class PlannerComponent implements OnDestroy {
  // ── State signals ─────────────────────────────────────────────────────────
  lang     = signal<Lang>('it');
  stage    = signal<Stage>('empty');
  overlay  = signal<Overlay>(null);
  budget   = signal(1200);
  dateMode = signal<DateMode>('flex');
  nights   = signal(4);
  adults   = signal(2);
  children = signal(0);
  destOpen = signal(true);
  priority = signal<Priority>('food');
  constraints = signal<string[]>(['sea']);
  selId    = signal('amalfi');
  agentStep   = signal(0);
  checkStep   = signal(0);
  payMode     = signal<'full' | 'install'>('full');
  messages    = signal<{ kind: string; from?: string; text?: string }[]>([]);
  conciergeTyping = signal(false);
  suggestionUsed  = signal(false);
  tableBooked     = signal(false);

  private _timers: ReturnType<typeof setTimeout>[] = [];

  // ── Services ──────────────────────────────────────────────────────────────
  readonly authService = inject(AuthService);
  private readonly travelService = inject(TravelService);
  private readonly catalogService = inject(CatalogService);
  private readonly bookingService = inject(BookingService);
  private readonly paymentService = inject(PaymentService);
  private readonly transloco = inject(TranslocoService);
  private langSub?: Subscription;

  constructor() {
    const apply = (l: string) => {
      if (l === 'it' || l === 'en' || l === 'fr' || l === 'es') this.lang.set(l);
    };
    apply(this.transloco.getActiveLang());
    this.langSub = this.transloco.langChanges$.subscribe(apply);
  }

  // ── Auth modal state ──────────────────────────────────────────────────────
  showAuthModal = signal(false);
  authMode = signal<'login' | 'register'>('login');
  authEmailVal = '';
  authPasswordVal = '';
  authFirstNameVal = '';
  authLastNameVal = '';
  authErrorMsg = '';
  authLoadingState = false;

  // ── Backend integration state ─────────────────────────────────────────────
  private rawBackendData = signal<any[]>([]);
  useBackendProposals = signal(false);
  currentRequestId = signal<string | null>(null);
  currentBookingId = signal<string | null>(null);
  private departureDateStr = '';
  private returnDateStr = '';

  // ── Derived ───────────────────────────────────────────────────────────────
  t = computed(() => STR[this.lang()]);

  budgetStr = computed(() => fmt(this.budget(), this.lang()));

  budgetPct = computed(() => {
    const pct = Math.round((this.budget() - 400) / (4000 - 400) * 100);
    return `${pct}%`;
  });

  steps = computed(() => {
    const t = this.t();
    const stage = this.stage();
    const overlay = this.overlay();
    let active = 'plan';
    if (stage === 'generating' || stage === 'results') active = 'proposals';
    else if (stage === 'detail') active = 'detail';
    if (overlay) active = 'book';
    const order = ['plan','proposals','detail','book'];
    const ai = order.indexOf(active);
    const defs: [string, string, keyof Strings][] = [
      ['plan','tune','st_plan'],['proposals','dashboard','st_proposals'],
      ['detail','description','st_detail'],['book','shopping_cart_checkout','st_book']
    ];
    return defs.map((s, i) => {
      const on = i <= ai;
      return { label: t[s[2]] as string, icon: s[1], arrow: i < defs.length - 1, on };
    });
  });

  proposals = computed(() => {
    const lang = this.lang(); const it = lang === 'it';
    const t = this.t();
    const n = this.nights(); const ppl = this.adults() + this.children();
    const nightsTxt = `${n} ${t.rs_nights}`;
    const per = (tot: number) => { const v = Math.round(tot / Math.max(1, ppl)); return `€${fmt(v, lang)} ${t.per_person}`; };
    const budget = this.budget();

    const mk = (o: {
      id: string; dest: string; title: string; img: string; caption: string;
      recommended: boolean; total: number; hotel: string; hp: number;
      rest: string; rp: number; flight: string; fp: number; why: string;
      hotelMeta: string; restMeta: string; flightMeta: string; cancel: string;
      splits: [string, number][];
    }) => {
      const diff = o.total - budget;
      const over = diff > 0;
      const ratio = o.total / budget;
      return {
        ...o,
        nights: nightsTxt, perPerson: per(o.total),
        totalStr: fmt(o.total, lang), hotelPrice: fmt(o.hp, lang),
        restPrice: fmt(o.rp, lang), flightPrice: fmt(o.fp, lang),
        delta: over ? `+€${fmt(diff, lang)}` : t.under_budget + `€${fmt(Math.abs(diff), lang)}`,
        deltaFg: over ? 'var(--brand)' : 'var(--teal)',
        deltaBg: over ? 'var(--brand-light)' : 'var(--teal-light)',
        deltaIcon: over ? 'trending_up' : 'trending_down',
        cardBd: o.recommended ? '#E9C07E' : 'var(--border)',
        fitPct: Math.round(ratio * 100) + '%',
        fitBar: Math.min(100, Math.round(ratio * 100)) + '%',
        fitLabel: over ? t.fit_over : t.fit_in,
        fitFg: over ? 'var(--brand)' : 'var(--teal)',
        fitColor: over ? 'var(--brand)' : 'linear-gradient(90deg, var(--brand), var(--brand-hover))',
      };
    };

    if (this.useBackendProposals() && this.rawBackendData().length) {
      return this.rawBackendData().map(o => mk(o));
    }

    return [
      mk({ id:'amalfi', dest:'Amalfi', title: it?'Costiera Gourmet':'Gourmet Coast', img: IMG.amalfi, caption:'Amalfi · Costiera Amalfitana', recommended:true, total:1190,
           hotel:'Hotel Lidomare 3★', hp:560, rest: it?'2 ristoranti consigliati':'2 recommended restaurants', rp:330, flight: it?'Volo A/R · NAP':'Round-trip · NAP', fp:300,
           why: it?'Questo hotel ti lascia più budget per i ristoranti, la tua priorità.':'This stay frees up more budget for restaurants, your priority.',
           hotelMeta: it?'Centro · 4 notti · colazione':'Central · 4 nights · breakfast',
           restMeta: it?'Cucina locale · fascia media':'Local cuisine · mid-range',
           flightMeta: it?'Bagaglio a mano · diretto':'Carry-on · direct',
           cancel: it?'Cancellazione gratuita fino a 7 giorni prima.':'Free cancellation up to 7 days before.',
           splits:[['stay',560],['food',330],['transport',300]] }),
      mk({ id:'positano', dest:'Positano', title: it?'Lusso sulla Scogliera':'Clifftop Luxury', img: IMG.positano, caption:'Positano · Case sul mare', recommended:false, total:1250,
           hotel: it?'Le Sirenuse 4★':'Le Sirenuse 4★', hp:650, rest: it?'2 ristoranti con vista':'2 sea-view restaurants', rp:320, flight: it?'Volo A/R · NAP':'Round-trip · NAP', fp:280,
           why: it?'Positano offre viste spettacolari e una scena gastronomica di alto livello.':'Positano delivers spectacular views and a top-tier restaurant scene.',
           hotelMeta: it?'Vista mare · 4 notti · terrazza':'Sea view · 4 nights · terrace',
           restMeta: it?'Alta cucina campana':'Fine Campanian cuisine',
           flightMeta: it?'Diretto · bagaglio incluso':'Direct · bag included',
           cancel: it?'Cancellazione gratuita fino a 5 giorni prima.':'Free cancellation up to 5 days before.',
           splits:[['stay',650],['food',320],['transport',280]] }),
      mk({ id:'cinque', dest:'Cinque Terre', title: it?'Borghi sul Mare':'Seaside Villages', img: IMG.cinque, caption:'Vernazza · Cinque Terre', recommended:false, total:1150,
           hotel: it?'Affittacamere Marina 3★':'Marina Rooms 3★', hp:600, rest: it?'1 ristorante + degustazione':'1 restaurant + tasting', rp:280, flight: it?'Treno veloce A/R':'High-speed train r/t', fp:270,
           why: it?'Più tempo a piedi tra i borghi, con una degustazione inclusa.':'More time exploring the villages on foot, with a tasting included.',
           hotelMeta: it?'Vista mare · 4 notti':'Sea view · 4 nights',
           restMeta: it?'Pesce locale · degustazione':'Local seafood · tasting',
           flightMeta: it?'Alta velocità · diretto':'High-speed · direct',
           cancel: it?'Cancellazione gratuita fino a 5 giorni prima.':'Free cancellation up to 5 days before.',
           splits:[['stay',600],['food',280],['transport',270]] }),
      mk({ id:'venezia', dest:'Venezia', title: it?'Laguna Romantica':'Romantic Lagoon', img: IMG.venezia, caption:'Venezia · Canal Grande', recommended:false, total:1380,
           hotel: it?'Hotel Ca\' Sagredo 4★':'Hotel Ca\' Sagredo 4★', hp:720, rest: it?'2 bacari + osteria':'2 bacari + osteria', rp:360, flight: it?'Volo A/R · VCE':'Round-trip · VCE', fp:300,
           why: it?'Venezia unica: bacari nascosti e cichetti autentici al di fuori dei circuiti turistici.':'Venice\'s hidden bacari and authentic cichetti off the tourist circuit.',
           hotelMeta: it?'Canal Grande · 4 notti':'Canal Grande · 4 nights',
           restMeta: it?'Cicchetti · cucina veneziana':'Cichetti · Venetian cuisine',
           flightMeta: it?'Diretto · frequente':'Direct · frequent',
           cancel: it?'Cancellazione gratuita fino a 7 giorni prima.':'Free cancellation up to 7 days before.',
           splits:[['stay',720],['food',360],['transport',300]] }),
      mk({ id:'firenze', dest:'Firenze', title: it?'Arte & Bistecca':'Art & Bistecca', img: IMG.firenze, caption:'Firenze · Vista dal Piazzale', recommended:false, total:1120,
           hotel: it?'Residenza d\'Epoca 3★':'Residenza d\'Epoca 3★', hp:540, rest: it?'2 trattorie fiorentine':'2 Florentine trattorias', rp:310, flight: it?'Volo A/R · FLR':'Round-trip · FLR', fp:270,
           why: it?'Firenze combina arte rinascimentale e gastronomia toscana a tariffe ragionevoli.':'Florence combines Renaissance art and Tuscan gastronomy at reasonable rates.',
           hotelMeta: it?'Oltrarno · 4 notti · colazione':'Oltrarno · 4 nights · breakfast',
           restMeta: it?'Bistecca · cucina toscana':'Bistecca · Tuscan cuisine',
           flightMeta: it?'Diretto · bagaglio':'Direct · luggage',
           cancel: it?'Cancellazione gratuita fino a 7 giorni prima.':'Free cancellation up to 7 days before.',
           splits:[['stay',540],['food',310],['transport',270]] }),
      mk({ id:'sardegna', dest:'Sardegna', title: it?'Mare Smart':'Smart Seaside', img: IMG.sardegna, caption:'Sardegna · Acque cristalline', recommended:false, total:980,
           hotel:'B&B Maestrale 3★', hp:480, rest: it?'1 ristorante consigliato':'1 recommended restaurant', rp:200, flight: it?'Volo low-cost A/R':'Low-cost flight r/t', fp:300,
           why: it?'L\'opzione più economica: sotto budget mantenendo la priorità sul cibo.':'The most affordable option: under budget while keeping food the focus.',
           hotelMeta: it?'Vicino spiaggia · 4 notti':'Near beach · 4 nights',
           restMeta: it?'Trattoria · fascia bassa':'Trattoria · budget',
           flightMeta: it?'Low-cost · 1 scalo':'Low-cost · 1 stop',
           cancel: it?'Cancellazione gratuita fino a 10 giorni prima.':'Free cancellation up to 10 days before.',
           splits:[['stay',480],['food',200],['transport',300]] }),
      mk({ id:'capri', dest:'Capri', title: it?'Isola del Lusso':'Island of Luxury', img: IMG.capri, caption:'Capri · Faraglioni', recommended:false, total:1490,
           hotel: it?'Hotel Punta Tragara 4★':'Hotel Punta Tragara 4★', hp:800, rest: it?'2 ristoranti vista mare':'2 sea-view restaurants', rp:390, flight: it?'Volo + traghetto A/R':'Flight + ferry r/t', fp:300,
           why: it?'Capri è fuori budget di poco: l\'esperienza unica giustifica lo scarto.':'Capri is slightly over budget — the unique experience justifies the gap.',
           hotelMeta: it?'Vista Faraglioni · 4 notti':'Faraglioni view · 4 nights',
           restMeta: it?'Cucina isolana · fascia alta':'Island cuisine · upscale',
           flightMeta: it?'Napoli + aliscafo':'Naples + hydrofoil',
           cancel: it?'Cancellazione gratuita fino a 10 giorni prima.':'Free cancellation up to 10 days before.',
           splits:[['stay',800],['food',390],['transport',300]] }),
      mk({ id:'napoli', dest:'Napoli', title: it?'Pizza & Cultura':'Pizza & Culture', img: IMG.napoli, caption:'Napoli · Lungomare', recommended:false, total:890,
           hotel: it?'B&B Toledo 3★':'B&B Toledo 3★', hp:380, rest: it?'3 pizzerie + trattoria':'3 pizzerias + trattoria', rp:260, flight: it?'Volo A/R · NAP':'Round-trip · NAP', fp:250,
           why: it?'Napoli è l\'opzione più economica con la scena gastronomica più autentica d\'Italia.':'Naples is the best-value pick with Italy\'s most authentic food scene.',
           hotelMeta: it?'Quartieri Spagnoli · 4 notti':'Quartieri Spagnoli · 4 nights',
           restMeta: it?'Pizza DOC · frittura napoletana':'DOC pizza · Neapolitan fry',
           flightMeta: it?'Frequente · diretto':'Frequent · direct',
           cancel: it?'Cancellazione gratuita fino a 5 giorni prima.':'Free cancellation up to 5 days before.',
           splits:[['stay',380],['food',260],['transport',250]] }),
      mk({ id:'roma', dest:'Roma', title: it?'Arte & Cucina':'Art & Cuisine', img: IMG.roma, caption:'Roma · Colosseo al tramonto', recommended:false, total:1310,
           hotel: it?'Hotel Centrale 4★':'Hotel Centrale 4★', hp:680, rest: it?'3 trattorie storiche':'3 historic trattorias', rp:380, flight: it?'Volo A/R · FCO':'Round-trip · FCO', fp:250,
           why: it?'Roma offre la massima densità di esperienze gastronomiche storiche nel raggio del budget.':'Rome delivers maximum historic gastronomy density within your budget.',
           hotelMeta: it?'Centro storico · 4 notti':'Historic centre · 4 nights',
           restMeta: it?'Cucina romana classica':'Classic Roman cuisine',
           flightMeta: it?'Frequente · diretto':'Frequent · direct',
           cancel: it?'Cancellazione gratuita fino a 7 giorni prima.':'Free cancellation up to 7 days before.',
           splits:[['stay',680],['food',380],['transport',250]] }),
      mk({ id:'sicilia', dest:'Sicilia', title: it?'Sapori del Sud':'Southern Flavours', img: IMG.sicilia, caption:'Sicilia · Paesaggio rurale', recommended:false, total:1040,
           hotel: it?'Masseria Sole 3★':'Masseria Sole 3★', hp:490, rest: it?'2 ristoranti di mare':'2 seafood restaurants', rp:290, flight: it?'Volo A/R · CTA':'Round-trip · CTA', fp:260,
           why: it?'La Sicilia combina spiagge e gastronomia eccezionale a un prezzo accessibile.':'Sicily pairs exceptional beaches and food at an accessible price point.',
           hotelMeta: it?'Vista mare · 4 notti · piscina':'Sea view · 4 nights · pool',
           restMeta: it?'Pesce fresco · cucina locale':'Fresh fish · local cuisine',
           flightMeta: it?'Diretto · bagaglio incluso':'Direct · bag included',
           cancel: it?'Cancellazione gratuita fino a 5 giorni prima.':'Free cancellation up to 5 days before.',
           splits:[['stay',490],['food',290],['transport',260]] }),
      mk({ id:'matera', dest:'Matera', title: it?'Sassi & Sapori':'Sassi & Flavours', img: IMG.matera, caption:'Matera · Sassi al tramonto', recommended:false, total:850,
           hotel: it?'Sextantio Cave Hotel 4★':'Sextantio Cave Hotel 4★', hp:390, rest: it?'2 ristoranti nei Sassi':'2 Sassi restaurants', rp:220, flight: it?'Volo A/R · BRI + bus':'Round-trip · BRI + bus', fp:240,
           why: it?'Matera è Capitale Europea della Cultura: hotel grotta unico al mondo, cucina lucana autentica.':'Matera is European Capital of Culture: world-unique cave hotel, authentic Lucanian cuisine.',
           hotelMeta: it?'Grotta · 4 notti · colazione':'Cave room · 4 nights · breakfast',
           restMeta: it?'Cucina lucana · fascia media':'Lucanian cuisine · mid-range',
           flightMeta: it?'Bari + bus diretto':'Bari + direct bus',
           cancel: it?'Cancellazione gratuita fino a 10 giorni prima.':'Free cancellation up to 10 days before.',
           splits:[['stay',390],['food',220],['transport',240]] }),
      mk({ id:'puglia', dest:'Puglia', title: it?'Masseria & Mare':'Masseria & Sea', img: IMG.puglia, caption:'Puglia · Trulli di Alberobello', recommended:false, total:1070,
           hotel: it?'Masseria Trullo 4★':'Masseria Trullo 4★', hp:520, rest: it?'2 osterie tipiche':'2 typical osterias', rp:270, flight: it?'Volo A/R · BRI':'Round-trip · BRI', fp:280,
           why: it?'Architettura unica, cucina autentica e mare cristallino, tutto nel budget.':'Unique architecture, authentic cuisine and crystal sea, all within budget.',
           hotelMeta: it?'Campagna · 4 notti · piscina':'Countryside · 4 nights · pool',
           restMeta: it?'Cucina pugliese autentica':'Authentic Puglian cuisine',
           flightMeta: it?'Diretto · frequente':'Direct · frequent',
           cancel: it?'Cancellazione gratuita fino a 7 giorni prima.':'Free cancellation up to 7 days before.',
           splits:[['stay',520],['food',270],['transport',280]] }),
    ];
  });

  selectedProposal = computed(() => {
    return this.proposals().find(p => p.id === this.selId()) ?? this.proposals()[0];
  });

  mapPins = computed<PlannerPin[]>(() =>
    this.proposals().map(p => ({
      id: p.id,
      dest: p.dest,
      total: p.totalStr,
      recommended: p.recommended,
    }))
  );

  selectMapPin(id: string): void {
    this.selId.set(id);
    if (this.stage() === 'results' || this.stage() === 'detail') {
      this.stage.set('detail');
    }
  }

  selSplits = computed(() => {
    const p = this.selectedProposal();
    const lang = this.lang(); const t = this.t();
    const meta: Record<string, { label: string; icon: string; color: string; ideal: number }> = {
      stay:      { label: t.split_stay,      icon:'hotel',          color:'#B07B4E', ideal: 35 },
      food:      { label: t.split_food,      icon:'restaurant',     color:'#C0894B', ideal: 40 },
      transport: { label: t.split_transport, icon:'flight_takeoff', color:'#5E8C9E', ideal: 25 },
    };
    return p.splits.map(([k, amt]: [string, number]) => ({
      label: meta[k].label, icon: meta[k].icon, color: meta[k].color,
      amount: fmt(amt, lang),
      pct: Math.round(amt / p.total * 100) + '%',
      ideal: meta[k].ideal + '%',
    }));
  });

  agents = computed(() => {
    const t = this.t(); const step = this.agentStep();
    const A = [
      { key:'orch',   icon:'dashboard_customize', iconBg:'var(--brand-light)', iconFg:'var(--brand)' },
      { key:'hotel',  icon:'hotel',               iconBg:'#FDECEA', iconFg:'#E5352B' },
      { key:'rest',   icon:'restaurant',           iconBg:'#FEF3C7', iconFg:'#D97706' },
      { key:'flight', icon:'flight_takeoff',       iconBg:'#E0F2FE', iconFg:'#E5352B' },
      { key:'rank',   icon:'stacked_bar_chart',    iconBg:'#FDECEA', iconFg:'#E5352B' },
    ];
    return A.map((a, i) => ({
      name: (t as unknown as Record<string, string>)['ag_' + a.key],
      task: (t as unknown as Record<string, string>)['ag_' + a.key + '_t'],
      icon: a.icon, iconBg: a.iconBg, iconFg: a.iconFg,
      opacity: step >= i + 1 ? 1 : 0.4,
      done: step > i + 1,
      active: step === i + 1,
      pending: step < i + 1,
    }));
  });

  checks = computed(() => {
    const t = this.t();
    const sel = this.selectedProposal();
    const step = this.checkStep();
    const labels = [
      `Hotel · ${sel.hotel}`,
      t.check_restaurants,
      t.check_flight,
    ];
    return labels.map((label, i) => {
      const done = step > i; const active = step === i;
      return {
        label,
        done, active, pending: !done && !active,
        status: done ? t.check_available : active ? t.check_checking : '—',
        fg: done ? 'var(--teal)' : active ? '#B49A7C' : '#C9BBA6',
      };
    });
  });

  allChecked = computed(() => this.checkStep() >= 3);

  prioOptions = computed(() => {
    const t = this.t(); const p = this.priority();
    return [
      { key: 'food', label: t.prio_food, icon: 'restaurant' },
      { key: 'stay', label: t.prio_stay, icon: 'hotel' },
      { key: 'bal',  label: t.prio_bal,  icon: 'balance' },
    ].map(o => ({
      ...o,
      on: p === o.key,
      bg: p === o.key ? 'var(--brand-light)' : 'var(--bg-primary)',
      bd: p === o.key ? '#F3B0AB' : 'var(--border)',
      fg: p === o.key ? 'var(--brand)' : 'var(--text-tertiary)',
    }));
  });

  constraintChips = computed(() => {
    const t = this.t(); const cs = this.constraints();
    return [
      { key:'sea',    label: t.c_sea,    icon:'beach_access' },
      { key:'family', label: t.c_family, icon:'family_restroom' },
      { key:'pets',   label: t.c_pets,   icon:'pets' },
      { key:'access', label: t.c_access, icon:'accessible' },
    ].map(c => ({
      ...c,
      on: cs.includes(c.key),
      bg: cs.includes(c.key) ? 'var(--brand)' : 'var(--surface)',
      fg: cs.includes(c.key) ? '#fff' : 'var(--text-secondary)',
      bd: cs.includes(c.key) ? 'var(--brand)' : 'var(--border)',
    }));
  });

  chatMessages = computed(() => {
    const t = this.t();
    return this.messages().map(m => {
      if (m.kind === 'offer') {
        return { isOffer: true, isText: false, justify: 'flex-start',
          img: IMG.table, caption: 'PHOTO · table setting',
          badge: t.cc_offer_badge, title: t.cc_offer_title,
          sub: t.cc_offer_sub, cta: t.cc_offer_cta };
      }
      const me = m.from === 'user';
      return { isText: true, isOffer: false, justify: me ? 'flex-end' : 'flex-start',
        text: m.text, bg: me ? '#E5352B' : '#fff', fg: me ? '#fff' : '#0F172A',
        radius: me ? '18px 18px 4px 18px' : '18px 18px 18px 4px' };
    });
  });

  travelerCount = computed(() => {
    const t = this.t();
    const a = this.adults(); const c = this.children();
    return `${a} ${t.tr_adults}${c ? ` · ${c} ${t.tr_children}` : ''}`;
  });

  resultSummary = computed(() => {
    const t = this.t();
    const p = this.priority();
    const prioLabel = p === 'food' ? t.rs_prio_food : p === 'stay' ? t.rs_prio_stay : t.rs_prio_bal;
    return `€${this.budgetStr()} · ${this.nights()} ${t.rs_nights} · ${this.adults()+this.children()} ${t.rs_ppl} · ${prioLabel}`;
  });

  rateStr = computed(() => fmt(Math.round(this.selectedProposal().total / 3), this.lang()));

  payBtnLabel = computed(() => {
    const t = this.t(); const sel = this.selectedProposal();
    return this.payMode() === 'full'
      ? t.p_pay_full + sel.totalStr
      : t.p_pay_install + this.rateStr();
  });

  installSub = computed(() => `${this.t().install_sub}${this.rateStr()}`);

  generateLabel = computed(() => {
    const t = this.t(); const s = this.stage();
    return s === 'results' || s === 'detail' ? t.gen_again : t.gen;
  });

  installLabels = computed(() => {
    const t = this.t();
    return [t.p_now, '+30g', '+60g'];
  });

  confirmItems = computed(() => {
    const t = this.t();
    return [
      { label: t.conf_hotel, ref: '#HT-4821' },
      { label: t.conf_restaurants, ref: '#RS-2207' },
      { label: t.conf_flight, ref: '#FL-9034' },
    ];
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  toggleLang(): void {
    const order: Lang[] = ['en', 'it', 'fr', 'es'];
    const i = order.indexOf(this.lang());
    this.lang.set(order[(i + 1) % order.length]);
  }

  restart(): void {
    this._clearTimers();
    this.stage.set('empty'); this.overlay.set(null);
    this.budget.set(1200); this.dateMode.set('flex'); this.nights.set(4);
    this.adults.set(2); this.children.set(0); this.destOpen.set(true);
    this.priority.set('food'); this.constraints.set(['sea']); this.selId.set('amalfi');
    this.agentStep.set(0); this.checkStep.set(0); this.payMode.set('full');
    this.messages.set([]); this.conciergeTyping.set(false);
    this.suggestionUsed.set(false); this.tableBooked.set(false);
    this.useBackendProposals.set(false);
    this.rawBackendData.set([]);
    this.currentRequestId.set(null);
    this.currentBookingId.set(null);
  }

  // ── Auth methods ──────────────────────────────────────────────────────────
  login(): void {
    if (!this.authEmailVal || !this.authPasswordVal) {
      this.authErrorMsg = this.t().auth_email_required;
      return;
    }
    this.authLoadingState = true;
    this.authErrorMsg = '';
    this.authService.login({ email: this.authEmailVal, password: this.authPasswordVal }).subscribe({
      next: () => {
        this.authLoadingState = false;
        this.showAuthModal.set(false);
        this.authEmailVal = '';
        this.authPasswordVal = '';
      },
      error: () => {
        this.authLoadingState = false;
        this.authErrorMsg = this.t().auth_invalid;
      }
    });
  }

  register(): void {
    if (!this.authFirstNameVal || !this.authLastNameVal || !this.authEmailVal || !this.authPasswordVal) {
      this.authErrorMsg = this.t().auth_fields_required;
      return;
    }
    this.authLoadingState = true;
    this.authErrorMsg = '';
    this.authService.register({
      email: this.authEmailVal,
      password: this.authPasswordVal,
      firstName: this.authFirstNameVal,
      lastName: this.authLastNameVal,
    }).subscribe({
      next: () => {
        this.authLoadingState = false;
        this.showAuthModal.set(false);
        this.authEmailVal = '';
        this.authPasswordVal = '';
        this.authFirstNameVal = '';
        this.authLastNameVal = '';
      },
      error: (err: any) => {
        this.authLoadingState = false;
        this.authErrorMsg = err?.error?.error ?? this.t().auth_register_error;
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe();
    this.useBackendProposals.set(false);
    this.rawBackendData.set([]);
    this.currentBookingId.set(null);
    this.currentRequestId.set(null);
  }

  closeAuthModal(): void {
    this.showAuthModal.set(false);
    this.authErrorMsg = '';
  }

  generate(): void {
    if (!this.authService.isAuthenticated()) {
      this.showAuthModal.set(true);
      return;
    }

    this._clearTimers();
    this.stage.set('generating');
    this.overlay.set(null);
    this.agentStep.set(0);
    this.useBackendProposals.set(false);
    this.rawBackendData.set([]);

    // Drive the orchestrator animation; the final "ranking" agent holds active
    // while we wait for the live backend result. We deliberately do NOT auto-jump
    // to the demo list — that swap only happens once live data lands (or we time out).
    [600, 1150, 1700, 2250, 2750].forEach((ms, i) => {
      this._timers.push(setTimeout(() => this.agentStep.set(i + 1), ms));
    });
    // Safety net: never leave the user stuck on the generating animation if the
    // request itself stalls. Falls back to demo proposals just past the poll window.
    this._timers.push(setTimeout(() => {
      if (this.stage() === 'generating') this.stage.set('results');
    }, PLANNER_GENERATION_TIMEOUT_MS + 5000));

    // Compute trip dates
    const dep = new Date();
    dep.setDate(dep.getDate() + 30);
    const ret = new Date(dep);
    ret.setDate(ret.getDate() + this.nights());
    this.departureDateStr = dep.toISOString().split('T')[0];
    this.returnDateStr = ret.toISOString().split('T')[0];

    const priorityMap: Record<string, string> = { food: 'FOOD', stay: 'STAY', bal: 'BALANCED' };

    this.travelService.createRequest({
      departureDate: this.departureDateStr,
      returnDate: this.returnDateStr,
      dateMode: this.dateMode() === 'fixed' ? 'FIXED' : 'FLEXIBLE',
      adultsCount: this.adults(),
      childrenCount: this.children() || undefined,
      budget: this.budget(),
      spendingPriority: priorityMap[this.priority()] as 'FOOD' | 'STAY' | 'BALANCED',
      constraints: this.constraints().length ? this.constraints() : undefined,
    }).pipe(
      switchMap(req => {
        this.currentRequestId.set(req.id);
        // Poll until the backend has generated at least one proposal, up to the
        // full live-generation window (LLM-bound, so this can take ~8–20s+).
        return timer(PLANNER_POLL_INTERVAL_MS, PLANNER_POLL_INTERVAL_MS).pipe(
          take(PLANNER_POLL_MAX_ATTEMPTS),
          switchMap(() => this.travelService.getProposals(req.id)),
          first(proposals => proposals.length > 0, [])
        );
      }),
      switchMap(proposals => forkJoin(proposals.map(p =>
        forkJoin({
          proposal: of(p),
          hotel: this.catalogService.getHotel(p.hotelId).pipe(catchError(() => of(null))),
          flight: p.flightId ? this.catalogService.getFlight(p.flightId).pipe(catchError(() => of(null))) : of(null),
        })
      )))
    ).subscribe({
      next: results => {
        const t = this.t();
        const destImgs: Record<string, string> = {
          default0: IMG.amalfi, default1: IMG.cinque, default2: IMG.sardegna,
          default3: IMG.roma,   default4: IMG.venezia, default5: IMG.firenze,
        };

        this.rawBackendData.set(results.map((r, idx) => {
          const p = r.proposal;
          const hotel = r.hotel;
          const flight = r.flight;
          const fallbackImg = destImgs[`default${idx % 6}`];
          return {
            id: p.id,
            dest: p.destination,
            title: p.destination,
            img: hotel?.imageUrl ? `url(${hotel.imageUrl}) center/cover no-repeat` : fallbackImg,
            caption: p.destination,
            recommended: idx === 0,
            total: Number(p.totalCost),
            hotel: hotel?.name ?? 'Hotel',
            hp: Number(p.hotelCost),
            rest: t.rest_recommended,
            rp: Number(p.restaurantCost),
            flight: flight ? `${flight.airline} · ${flight.flightNumber}` : t.flight_roundtrip,
            fp: Number(p.flightCost),
            why: p.aiMotivation ?? t.proposal_why_default,
            hotelMeta: hotel
              ? `${hotel.city} · ${this.nights()} ${t.rs_nights}${hotel.seaProximity ? t.hotel_sea : ''}`
              : '',
            restMeta: t.local_cuisine,
            flightMeta: flight?.baggageIncluded ? t.bag_included : t.carry_on,
            cancel: t.free_cancel,
            splits: [
              ['stay', Number(p.hotelCost)],
              ['food', Number(p.restaurantCost)],
              ['transport', Number(p.flightCost)],
            ] as [string, number][],
            // Backend IDs needed for booking
            proposalId: p.id,
            hotelId: p.hotelId,
            restaurantId: p.restaurantId,
            flightId: p.flightId,
          };
        }));

        if (results.length) {
          this.useBackendProposals.set(true);
          this.selId.set(results[0].proposal.id);
        }
        // Live data is ready (or the poll window elapsed → demo fallback): reveal results.
        this.stage.set('results');
      },
      error: err => {
        if (err.status === 401) {
          this.authService.clearAuth();
          this.showAuthModal.set(true);
          this.stage.set('empty');
        } else {
          // Backend unreachable/failed → fall back to demo proposals.
          this.stage.set('results');
        }
      }
    });
  }

  onBudget(e: Event): void {
    this.budget.set(parseInt((e.target as HTMLInputElement).value, 10));
  }

  nightsUp():    void { this.nights.update(n => Math.min(21, n + 1)); }
  nightsDown():  void { this.nights.update(n => Math.max(1, n - 1)); }
  adultsUp():    void { this.adults.update(n => Math.min(9, n + 1)); }
  adultsDown():  void { this.adults.update(n => Math.max(1, n - 1)); }
  childrenUp():  void { this.children.update(n => Math.min(6, n + 1)); }
  childrenDown():void { this.children.update(n => Math.max(0, n - 1)); }

  setPriority(k: Priority): void { this.priority.set(k); }
  setPriorityStr(k: string): void { this.priority.set(k as Priority); }
  toggleConstraint(k: string): void {
    this.constraints.update(cs => cs.includes(k) ? cs.filter(x => x !== k) : [...cs, k]);
  }
  toggleDest(): void { this.destOpen.update(v => !v); }

  openDetail(id: string): void { this.selId.set(id); this.stage.set('detail'); }
  backToResults(): void { this.stage.set('results'); }

  goBooking(): void {
    this.overlay.set('booking');
    this.checkStep.set(0);
    [700, 1400, 2100].forEach((ms, i) => {
      this._timers.push(setTimeout(() => this.checkStep.set(i + 1), ms));
    });

    if (this.useBackendProposals()) {
      const sel = this.selectedProposal() as any;
      this.bookingService.create({
        proposalId: sel.proposalId ?? sel.id,
        hotelId: sel.hotelId,
        restaurantId: sel.restaurantId,
        flightId: sel.flightId,
        destination: sel.dest,
        checkIn: this.departureDateStr,
        checkOut: this.returnDateStr,
        totalAmount: sel.total,
        hotelAmount: sel.hp,
        restaurantAmount: sel.rp,
        flightAmount: sel.fp,
        travelers: [{
          firstName: this.authService.currentUser()?.firstName ?? 'Traveler',
          lastName: this.authService.currentUser()?.lastName ?? '',
          primary: true,
        }],
      }).subscribe({
        next: booking => this.currentBookingId.set(booking.id),
        error: () => { /* continue with demo flow */ }
      });
    }
  }

  goPayment(): void { if (this.allChecked()) this.overlay.set('payment'); }
  backToBooking(): void { this.overlay.set('booking'); }

  confirmPay(): void {
    const bookingId = this.currentBookingId();
    if (bookingId) {
      const gateway = this.payMode() === 'install' ? 'KLARNA' : 'STRIPE';
      this.paymentService.initiate({
        bookingId,
        amount: this.selectedProposal().total,
        gateway: gateway as 'STRIPE' | 'KLARNA',
        type: 'CARD',
        currency: 'EUR',
      }).pipe(
        switchMap(payment => this.paymentService.confirm(payment.id))
      ).subscribe({
        next: () => this.overlay.set('confirmation'),
        error: () => this.overlay.set('confirmation'),
      });
    } else {
      this.overlay.set('confirmation');
    }
  }
  closeOverlay(): void { this.overlay.set(null); }

  openConcierge(): void {
    const t = this.t();
    this.overlay.set('concierge');
    this.messages.set([{ kind: 'text', from: 'ai', text: t.cc_greet }]);
    this.suggestionUsed.set(false); this.tableBooked.set(false); this.conciergeTyping.set(false);
  }

  sendSuggestion(): void {
    if (this.suggestionUsed()) return;
    const t = this.t();
    this.suggestionUsed.set(true);
    this.messages.update(ms => [...ms, { kind: 'text', from: 'user', text: t.cc_user }]);
    this.conciergeTyping.set(true);
    this._timers.push(setTimeout(() => {
      this.conciergeTyping.set(false);
      this.messages.update(ms => [...ms, { kind: 'text', from: 'ai', text: t.cc_reply }, { kind: 'offer' }]);
    }, 1500));
  }

  bookTable(): void {
    if (this.tableBooked()) return;
    const t = this.t();
    this.tableBooked.set(true);
    this.messages.update(ms => [...ms, { kind: 'text', from: 'ai', text: t.cc_booked }]);
  }

  changeToast = signal<string | null>(null);

  changeElement(type: 'hotel' | 'restaurant' | 'flight'): void {
    const labels = { hotel: 'hotel', restaurant: 'restaurant', flight: 'flight' };
    this.changeToast.set(`Finding alternative ${labels[type]}s…`);
    this._timers.push(setTimeout(() => {
      this.changeToast.set(null);
      this.backToResults();
    }, 1400));
  }

  private _clearTimers(): void {
    this._timers.forEach(clearTimeout);
    this._timers = [];
  }

  ngOnDestroy(): void { this._clearTimers(); this.langSub?.unsubscribe(); }
}
