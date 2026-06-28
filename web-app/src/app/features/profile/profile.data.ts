/**
 * Static presentation assets for the profile shell (used only as fallbacks until
 * the user uploads their own cover / avatar). All profile *content* — reviews,
 * photos, trips, stats, activity, places, achievements — is fetched from the
 * backend via ProfileService.getOverview().
 */

const U = (id: string, w = 200) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

export const DEFAULT_COVER = U('photo-1469474968028-56623f02e42e', 1600);
export const DEFAULT_AVATAR = U('photo-1500648767791-00dcc994a43e', 200);
