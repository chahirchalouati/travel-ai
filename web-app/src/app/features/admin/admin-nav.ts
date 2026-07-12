/** Canonical admin navigation model — shared by the rail and the ⌘K palette. */

export interface AdminNavItem {
  /** Route path segment under /admin. */
  path: string;
  /** i18n key for the label. */
  labelKey: string;
  /** Material Symbols Rounded glyph name. */
  icon: string;
}

export interface AdminNavGroup {
  /** i18n key for the group heading. */
  labelKey: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: readonly AdminNavGroup[] = [
  {
    labelKey: 'admin.grpOverview',
    items: [
      { path: 'overview', labelKey: 'admin.navOverview', icon: 'dashboard' },
      { path: 'revenue', labelKey: 'admin.navRevenue', icon: 'payments' },
    ],
  },
  {
    labelKey: 'admin.grpPeople',
    items: [
      { path: 'users', labelKey: 'admin.navUsers', icon: 'group' },
      { path: 'partners', labelKey: 'admin.navPartners', icon: 'store' },
      { path: 'partner-onboarding', labelKey: 'admin.navPartnerOnboarding', icon: 'rocket_launch' },
    ],
  },
  {
    labelKey: 'admin.grpCatalog',
    items: [
      { path: 'hotels', labelKey: 'admin.navHotels', icon: 'hotel' },
      { path: 'flights', labelKey: 'admin.navFlights', icon: 'flight' },
      { path: 'cruises', labelKey: 'admin.navCruises', icon: 'directions_boat' },
      { path: 'restaurants', labelKey: 'admin.navRestaurants', icon: 'restaurant' },
      { path: 'destinations', labelKey: 'admin.navDestinations', icon: 'public' },
      { path: 'attractions', labelKey: 'admin.navAttractions', icon: 'attractions' },
      { path: 'stories', labelKey: 'admin.navStories', icon: 'movie' },
    ],
  },
  {
    labelKey: 'admin.grpOps',
    items: [
      { path: 'bookings', labelKey: 'admin.navBookings', icon: 'confirmation_number' },
      { path: 'payments', labelKey: 'admin.navPayments', icon: 'account_balance_wallet' },
      { path: 'subscriptions', labelKey: 'admin.navPrime', icon: 'workspace_premium' },
      { path: 'reviews', labelKey: 'admin.navReviews', icon: 'reviews' },
      { path: 'promos', labelKey: 'admin.navPromos', icon: 'sell' },
    ],
  },
  {
    labelKey: 'admin.grpSystem',
    items: [
      { path: 'ai-logs', labelKey: 'admin.navLogs', icon: 'monitoring' },
      { path: 'audit', labelKey: 'admin.navAudit', icon: 'history' },
      { path: 'broadcast', labelKey: 'admin.navBroadcast', icon: 'campaign' },
      { path: 'flags', labelKey: 'admin.navFlags', icon: 'toggle_on' },
      { path: 'rag', labelKey: 'admin.navRag', icon: 'network_intelligence' },
    ],
  },
];

/** Flat list of all nav items, for the command palette. */
export const ADMIN_NAV_FLAT: readonly AdminNavItem[] = ADMIN_NAV.flatMap(g => g.items);
