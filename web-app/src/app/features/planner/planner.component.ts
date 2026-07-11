import { Component, computed, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap, forkJoin, of, catchError, timer, take, first } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TravelService } from '../../core/services/travel.service';
import { CatalogService } from '../../core/services/catalog.service';
import { BookingService } from '../../core/services/booking.service';
import { PaymentService } from '../../core/services/payment.service';
import { ChatService } from '../../core/services/chat.service';
import { PlannerMapComponent, PlannerPin } from './planner-map.component';
import { UiSentenceBriefComponent, type TripBrief } from '../../shared/ui';

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
  notice_offline: string; notice_slow: string; notice_dismiss: string; r_empty: string;
  d_back: string; d_breakdown: string; d_vs_budget: string; d_ideal: string;
  d_elements: string; d_change: string; d_book: string;
  b_title: string; b_checking: string; b_traveler: string; b_summary: string;
  b_total: string; b_continue: string; b_wait: string; b_error: string;
  p_title: string; p_paying: string; p_how: string; p_full: string; p_full_sub: string;
  p_install: string; p_plan: string; p_now: string; p_platform: string;
  p_pay_full: string; p_pay_install: string;
  c_title: string; c_sub: string; c_concierge: string; c_concierge_sub: string;
  c_open: string; c_restart: string; concept: string;
  cc_title: string; cc_context: string; cc_suggestion: string; cc_placeholder: string;
  cc_error: string;
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
    notice_offline:'Servizio AI non raggiungibile — nessuna proposta da mostrare. Riprova tra poco.', notice_slow:'L’AI sta impiegando pi\xf9 del previsto — nessuna proposta ancora. Riprova tra poco.', notice_dismiss:'Chiudi', r_empty:'Nessuna proposta disponibile al momento.',
    d_back:'Torna alle proposte', d_breakdown:'Ripartizione budget', d_vs_budget:'sul tuo budget', d_ideal:'Ripartizione ideale per le tue priorit\xe0', d_elements:'Componenti del viaggio', d_change:'Cambia', d_book:'Prenota',
    b_title:'Prenotazione', b_checking:'Disponibilit\xe0 in tempo reale', b_traveler:'Viaggiatore', b_summary:'Riepilogo costi', b_total:'Totale', b_continue:'Vai al pagamento', b_wait:'Verifica disponibilit\xe0\u2026', b_error:'Impossibile confermare la prenotazione. Riprova.',
    p_title:'Pagamento', p_paying:'Stai pagando', p_how:'Come vuoi pagare', p_full:'Saldo unico', p_full_sub:'Paga tutto adesso', p_install:'Pagamento rateale', p_plan:'Piano in 3 rate', p_now:'Oggi', p_platform:'La piattaforma incassa l\u2019intero importo subito, anche con rate: il rischio insoluto resta al gateway, mai alle strutture.', p_pay_full:'Paga \u20ac', p_pay_install:'Attiva Klarna \xb7 \u20ac',
    c_title:'Viaggio confermato!', c_sub:'Prenotazioni inviate, conferme in arrivo via email.', c_concierge:'Travel Concierge', c_concierge_sub:'La tua assistente AI durante il soggiorno. Si attiva 3 giorni prima della partenza.', c_open:'Apri il Concierge', c_restart:'Ricomincia il flusso', concept:'CONCEPT',
    cc_title:'Concierge AI', cc_context:'Conosco gi\xe0 il tuo viaggio: hotel, date e gruppo. Chiedimi pure in linguaggio naturale.', cc_suggestion:'Trovami un tavolo per stasera vicino all\u2019hotel', cc_placeholder:'Scrivi una richiesta\u2026',
    cc_error:'Il concierge non \xe8 al momento raggiungibile. Riprova tra poco.',
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
    notice_offline:'AI service unreachable — no proposals to show. Please try again shortly.', notice_slow:'The AI is taking longer than usual — no proposals yet. Try again in a moment.', notice_dismiss:'Dismiss', r_empty:'No proposals available right now.',
    d_back:'Back to proposals', d_breakdown:'Budget breakdown', d_vs_budget:'of your budget', d_ideal:'Ideal split for your priorities', d_elements:'Trip components', d_change:'Change', d_book:'Book',
    b_title:'Booking', b_checking:'Real-time availability', b_traveler:'Traveller', b_summary:'Cost summary', b_total:'Total', b_continue:'Go to payment', b_wait:'Checking availability\u2026', b_error:'Could not confirm the booking. Please try again.',
    p_title:'Payment', p_paying:'You\u2019re paying', p_how:'How would you like to pay', p_full:'Pay in full', p_full_sub:'Pay everything now', p_install:'Pay in instalments', p_plan:'3-instalment plan', p_now:'Today', p_platform:'The platform collects the full amount immediately, even on instalments: default risk stays with the gateway, never the partners.', p_pay_full:'Pay \u20ac', p_pay_install:'Start Klarna \xb7 \u20ac',
    c_title:'Trip confirmed!', c_sub:'Bookings sent, confirmations on their way by email.', c_concierge:'Travel Concierge', c_concierge_sub:'Your in-stay AI assistant. It unlocks 3 days before departure.', c_open:'Open Concierge', c_restart:'Restart the flow', concept:'CONCEPT',
    cc_title:'Concierge AI', cc_context:'I already know your trip: hotel, dates and group. Just ask in plain language.', cc_suggestion:'Find me a table tonight near the hotel', cc_placeholder:'Type a request\u2026',
    cc_error:'The concierge is unavailable right now. Please try again shortly.',
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
    notice_offline:'Service IA injoignable — aucune proposition à afficher. Réessayez dans un instant.', notice_slow:'L’IA prend plus de temps que d’habitude — aucune proposition pour le moment. Réessayez bient\xf4t.', notice_dismiss:'Fermer', r_empty:'Aucune proposition disponible pour le moment.',
    d_back:'Retour aux propositions', d_breakdown:'Répartition du budget', d_vs_budget:'de votre budget', d_ideal:'Répartition idéale selon vos priorités', d_elements:'Composants du voyage', d_change:'Changer', d_book:'Réserver',
    b_title:'Réservation', b_checking:'Disponibilité en temps réel', b_traveler:'Voyageur', b_summary:'Résumé des coûts', b_total:'Total', b_continue:'Passer au paiement', b_wait:'Vérification de la disponibilité\u2026', b_error:'Impossible de confirmer la réservation. Réessayez.',
    p_title:'Paiement', p_paying:'Vous payez', p_how:'Comment souhaitez-vous payer', p_full:'Paiement intégral', p_full_sub:'Payez tout maintenant', p_install:'Paiement échelonné', p_plan:'Plan en 3 versements', p_now:'Aujourd\u2019hui', p_platform:'La plateforme encaisse la totalité immédiatement, même en versements : le risque d\u2019impayé reste au gateway, jamais aux partenaires.', p_pay_full:'Payer \u20ac', p_pay_install:'Activer Klarna \xb7 \u20ac',
    c_title:'Voyage confirmé !', c_sub:'Réservations envoyées, confirmations en route par email.', c_concierge:'Travel Concierge', c_concierge_sub:'Votre assistant IA pendant le séjour. Il s\u2019active 3 jours avant le départ.', c_open:'Ouvrir le Concierge', c_restart:'Recommencer le flux', concept:'CONCEPT',
    cc_title:'Concierge IA', cc_context:'Je connais déjà votre voyage : hôtel, dates et groupe. Demandez-moi en langage naturel.', cc_suggestion:'Trouvez-moi une table ce soir près de l\u2019hôtel', cc_placeholder:'Écrivez une demande\u2026',
    cc_error:'Le concierge est indisponible pour le moment. R\xe9essayez dans un instant.',
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
    notice_slow:'La IA está tardando más de lo habitual — todavía no hay propuestas. Inténtalo de nuevo pronto.', notice_offline:'Servicio de IA no disponible — no hay propuestas para mostrar. Inténtalo de nuevo en un momento.', notice_dismiss:'Cerrar', r_empty:'No hay propuestas disponibles por ahora.',
    d_back:'Volver a propuestas', d_breakdown:'Desglose del presupuesto', d_vs_budget:'de tu presupuesto', d_ideal:'Desglose ideal según tus prioridades', d_elements:'Componentes del viaje', d_change:'Cambiar', d_book:'Reservar',
    b_title:'Reserva', b_checking:'Disponibilidad en tiempo real', b_traveler:'Viajero', b_summary:'Resumen de costes', b_total:'Total', b_continue:'Ir al pago', b_wait:'Verificando disponibilidad\u2026', b_error:'No se pudo confirmar la reserva. Int\u00e9ntalo de nuevo.',
    p_title:'Pago', p_paying:'Estás pagando', p_how:'¿Cómo quieres pagar?', p_full:'Pago único', p_full_sub:'Paga todo ahora', p_install:'Pago a plazos', p_plan:'Plan en 3 cuotas', p_now:'Hoy', p_platform:'La plataforma cobra el importe total de inmediato, incluso a plazos: el riesgo de impago queda en el gateway, nunca en los socios.', p_pay_full:'Pagar \u20ac', p_pay_install:'Activar Klarna \xb7 \u20ac',
    c_title:'¡Viaje confirmado!', c_sub:'Reservas enviadas, confirmaciones en camino por email.', c_concierge:'Travel Concierge', c_concierge_sub:'Tu asistente IA durante la estancia. Se activa 3 días antes de la salida.', c_open:'Abrir Concierge', c_restart:'Reiniciar el flujo', concept:'CONCEPT',
    cc_title:'Concierge IA', cc_context:'Ya conozco tu viaje: hotel, fechas y grupo. Pregúntame en lenguaje natural.', cc_suggestion:'Encuéntrame una mesa esta noche cerca del hotel', cc_placeholder:'Escribe una solicitud\u2026',
    cc_error:'El conserje no está disponible ahora mismo. Inténtalo de nuevo en un momento.',
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

// Neutral image placeholder (a CSS gradient — UI styling, not real-world data)
// used only when a backend record has no image of its own.
const PLACEHOLDER_IMG =
  'linear-gradient(135deg, #e9edf0 0%, #d7dee3 100%) center/cover no-repeat';

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
  imports: [CommonModule, FormsModule, PlannerMapComponent, UiSentenceBriefComponent],
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
  selId    = signal('');
  agentStep   = signal(0);
  checkStep   = signal(0);
  payMode     = signal<'full' | 'install'>('full');
  messages    = signal<{ kind: string; from?: string; text?: string }[]>([]);
  conciergeTyping = signal(false);
  suggestionUsed  = signal(false);
  // Why the results are demo data instead of live AI output (null = live/real).
  plannerNotice   = signal<'offline' | 'slow' | null>(null);
  // Real AI concierge (backend /api/chat) state
  conciergeConvId = signal<string | null>(null);
  conciergeInput  = '';

  private _timers: ReturnType<typeof setTimeout>[] = [];

  // ── Services ──────────────────────────────────────────────────────────────
  readonly authService = inject(AuthService);
  private readonly travelService = inject(TravelService);
  private readonly catalogService = inject(CatalogService);
  private readonly bookingService = inject(BookingService);
  private readonly paymentService = inject(PaymentService);
  private readonly chatService = inject(ChatService);
  private readonly transloco = inject(TranslocoService);
  private readonly route = inject(ActivatedRoute);
  private langSub?: Subscription;

  constructor() {
    const apply = (l: string) => {
      if (l === 'it' || l === 'en' || l === 'fr' || l === 'es') this.lang.set(l);
    };
    apply(this.transloco.getActiveLang());
    this.langSub = this.transloco.langChanges$.subscribe(apply);

    // Seed the plan from a sentence handed over by the hero search / quick-picks
    // (e.g. "10 quiet days in Japan with great food" → 10 nights, food priority).
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) this.seedFromQuery(q);
  }

  /** Best-effort mapping of a free-text trip brief onto the planner's own fields. */
  private seedFromQuery(raw: string): void {
    const q = raw.toLowerCase();
    // Take the number closest to a duration word ("10 quiet days" → 10), so an
    // adjective between the count and the unit doesn't defeat the match.
    const unit = q.match(/\b(?:nights?|days?|giorni|notti|nuits?|noches|d[ií]as?)\b/);
    if (unit) {
      const near = q.slice(0, unit.index).match(/(\d{1,2})(?!.*\d)/);
      const n = near ? parseInt(near[1], 10) : NaN;
      if (n >= 1 && n <= 30) this.nights.set(n);
    }
    if (/\b(food|eat|cuisine|dining|restaurant|foodie|cibo|mangiare|gastronom|comida|gastronomie)\b/.test(q)) {
      this.priority.set('food');
    }
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
  currentBookingRef = signal<string | null>(null);
  bookingError = signal(false);
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
    const lang = this.lang();
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
        fitColor: over ? 'var(--brand)' : 'var(--color-red)',
      };
    };

    // All proposals come from the backend. There is no demo/mock fallback: if
    // the backend returned nothing, this list is empty and the UI shows an
    // explicit error/empty state rather than fabricated trips.
    return this.rawBackendData().map(o => mk(o));
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
      // Real coords from the DB when the proposal came from the backend; demo
      // proposals carry none and are geocoded from `dest` by the map.
      lat: (p as { lat?: number | null }).lat ?? null,
      lng: (p as { lng?: number | null }).lng ?? null,
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
      { key:'flight', icon:'flight_takeoff',       iconBg:'#FDECEA', iconFg:'#E5352B' },
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
    return this.messages().map(m => {
      const me = m.from === 'user';
      return { justify: me ? 'flex-end' : 'flex-start',
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

  noticeText = computed(() => {
    const t = this.t();
    const n = this.plannerNotice();
    return n === 'offline' ? t.notice_offline : n === 'slow' ? t.notice_slow : '';
  });

  dismissNotice(): void { this.plannerNotice.set(null); }

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
    // Real booking reference from the backend booking (one booking covers the
    // hotel, restaurants and flight); '—' only if the booking call did not run.
    const ref = this.currentBookingRef();
    const display = ref ? `#${ref}` : '—';
    return [
      { label: t.conf_hotel, ref: display },
      { label: t.conf_restaurants, ref: display },
      { label: t.conf_flight, ref: display },
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
    this.priority.set('food'); this.constraints.set(['sea']); this.selId.set('');
    this.agentStep.set(0); this.checkStep.set(0); this.payMode.set('full');
    this.messages.set([]); this.conciergeTyping.set(false);
    this.suggestionUsed.set(false);
    this.useBackendProposals.set(false);
    this.rawBackendData.set([]);
    this.currentRequestId.set(null);
    this.currentBookingId.set(null);
    this.currentBookingRef.set(null);
    this.bookingError.set(false);
    this.conciergeConvId.set(null);
    this.conciergeInput = '';
    this.plannerNotice.set(null);
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

  /** Destinations offered by the sentence brief. */
  readonly briefPlaces = ['Kyoto', 'Lisbon', 'Amalfi', 'Reykjavík', 'Marrakech', 'Bali'];

  /** Sync a sentence brief into the planner's parameter signals. */
  applyBrief(b: TripBrief): void {
    this.nights.set(Math.max(1, Math.min(30, Math.round(b.nights))));
    this.adults.set(Math.max(1, Math.round(b.travellers)));
    this.children.set(0);
    this.budget.set(Math.max(400, Math.min(4000, Math.round(b.budget))));
    this.priority.set(b.focus.includes('food') ? 'food' : 'bal');
    this.destOpen.set(false);
  }

  /** Apply the brief, then kick off generation. */
  composeBrief(b: TripBrief): void {
    this.applyBrief(b);
    this.generate();
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
    this.plannerNotice.set(null);

    // Drive the orchestrator animation; the final "ranking" agent holds active
    // while we wait for the live backend result. We deliberately do NOT auto-jump
    // to the demo list — that swap only happens once live data lands (or we time out).
    [600, 1150, 1700, 2250, 2750].forEach((ms, i) => {
      this._timers.push(setTimeout(() => this.agentStep.set(i + 1), ms));
    });
    // Safety net: never leave the user stuck on the generating animation if the
    // request itself stalls. Falls back to demo proposals just past the poll window.
    this._timers.push(setTimeout(() => {
      if (this.stage() === 'generating') {
        this.plannerNotice.set('slow');
        this.stage.set('results');
      }
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

        this.rawBackendData.set(results.map((r, idx) => {
          const p = r.proposal;
          const hotel = r.hotel;
          const flight = r.flight;
          return {
            id: p.id,
            dest: p.destination,
            title: p.destination,
            img: hotel?.imageUrl ? `url(${hotel.imageUrl}) center/cover no-repeat` : PLACEHOLDER_IMG,
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
            // Authoritative map coordinates from the DB (never hardcoded)
            lat: hotel?.latitude ?? null,
            lng: hotel?.longitude ?? null,
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
          this.plannerNotice.set(null); // live AI data — no fallback notice
        } else {
          // Poll window elapsed with no proposals → demo fallback, tell the user why.
          this.plannerNotice.set('slow');
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
          // Backend unreachable/failed → fall back to demo proposals, surfaced as a notice.
          this.plannerNotice.set('offline');
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
    this.bookingError.set(false);
    // Reveal the first check rows while the real booking is created; the final
    // "all available" step only completes once the backend confirms it.
    [600, 1200].forEach((ms, i) => {
      this._timers.push(setTimeout(() => {
        if (this.checkStep() < i + 1) this.checkStep.set(i + 1);
      }, ms));
    });

    const sel = this.selectedProposal() as any;
    if (!sel) { this.bookingError.set(true); return; }
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
      next: booking => {
        this.currentBookingId.set(booking.id);
        this.currentBookingRef.set(booking.bookingReference);
        this.checkStep.set(3); // real backend confirmation → unlock payment
      },
      error: () => { this.bookingError.set(true); } // payment stays locked
    });
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
    this.overlay.set('concierge');
    this.conciergeConvId.set(null);
    this.conciergeInput = '';
    this.suggestionUsed.set(false);
    this.messages.set([]);
    // Ask the real AI concierge (backend /api/chat) for a welcome grounded in
    // the just-booked trip. The prompt is hidden; only the AI reply is shown.
    const dest = (this.selectedProposal() as { dest?: string } | undefined)?.dest;
    const intro = dest
      ? `I just booked a trip to ${dest}. Welcome me briefly as my travel concierge and offer help with restaurant tables, transfers and local activities during my stay.`
      : 'Welcome me briefly as my travel concierge and offer help during my stay.';
    this.postConcierge(intro, true);
  }

  /** Send the built-in quick suggestion as a real message to the AI concierge. */
  sendSuggestion(): void {
    if (this.conciergeTyping()) return;
    this.suggestionUsed.set(true);
    this.postConcierge(this.t().cc_suggestion);
  }

  /** Send whatever the traveller typed to the AI concierge. */
  sendConcierge(): void {
    const text = this.conciergeInput.trim();
    if (!text || this.conciergeTyping()) return;
    this.conciergeInput = '';
    this.suggestionUsed.set(true);
    this.postConcierge(text);
  }

  /** POST a message to the backend AI chat and append the grounded reply. */
  private postConcierge(message: string, hideUserMessage = false): void {
    if (!hideUserMessage) {
      this.messages.update(ms => [...ms, { kind: 'text', from: 'user', text: message }]);
    }
    this.conciergeTyping.set(true);
    this.chatService.chat({ conversationId: this.conciergeConvId(), message })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.conciergeTyping.set(false);
        if (!res) {
          this.messages.update(ms => [...ms, { kind: 'text', from: 'ai', text: this.t().cc_error }]);
          return;
        }
        this.conciergeConvId.set(res.conversationId);
        this.messages.update(ms => [...ms, { kind: 'text', from: 'ai', text: res.reply }]);
      });
  }

  /**
   * "Change" returns to the proposal list, where a different complete package
   * (hotel + restaurants + flight) can be chosen. There is no fabricated
   * single-component swap — the backend composes whole packages.
   */
  changeElement(_type: 'hotel' | 'restaurant' | 'flight'): void {
    this.backToResults();
  }

  private _clearTimers(): void {
    this._timers.forEach(clearTimeout);
    this._timers = [];
  }

  ngOnDestroy(): void { this._clearTimers(); this.langSub?.unsubscribe(); }
}
