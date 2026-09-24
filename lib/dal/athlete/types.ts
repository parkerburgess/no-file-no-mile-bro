/**
 * Written when an athlete is auto-provisioned from a JWT, which carries no date
 * of birth. Deliberately absurd so a stray MAF calculation is obviously wrong
 * rather than plausibly wrong. Must not be trusted while profileCompletedAt is
 * null.
 */
export const PLACEHOLDER_BIRTH_DATE = "1900-01-01";

export type Athlete = {
  athleteId: number;
  userId: string | null;
  distanceUnitId: number;
  email: string;
  displayName: string;
  birthDate: string;
  timeZoneId: string;
  profileCompletedAt: string | null;
  isProfileComplete: boolean;
};

export type ProvisionAthleteInput = {
  userId: string;
  email: string;
  displayName: string;
};

export type CompleteProfileInput = {
  birthDate: string;
  timeZoneId: string;
  distanceUnitId: number;
};

export interface IAthleteAccess {
  /**
   * Whether the auth service has granted this user the app. Checked by the app
   * itself rather than trusted from the hub navigation: a valid token from any
   * sibling app would otherwise get in by direct navigation.
   */
  hasAppGrant(userId: string): Promise<boolean>;

  /**
   * Resolves the athlete for a signed-in user, creating one on first sign-in.
   * Claims a hand-seeded athlete by email rather than duplicating it.
   */
  provision(input: ProvisionAthleteInput): Promise<Athlete>;

  completeProfile(athleteId: number, input: CompleteProfileInput): Promise<Athlete>;
}
