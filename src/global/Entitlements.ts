// RevenueCat entitlement identifier, as configured in the RevenueCat
// dashboard. Was previously duplicated as a literal string in App.tsx,
// premium-store.ts, use-premium.ts, and ProFeaturesPromotion.tsx — a rename
// in RevenueCat now only needs to change this one place.
//
// Deliberately dependency-free: stores/ imports this file, and stores/ is
// itself imported (transitively, via services/CommonServices.tsx) by
// Constants.tsx's `services` import, so pulling this constant from
// Constants.tsx instead of a standalone module would create an import cycle.
export const REVENUECAT_ENTITLEMENT_ID = '2026-packages';
