import sql from "mssql";
import { executeQuery } from "@parkerburgess/wandering-parker-server";
import {
  APP_NAME,
  DEFAULT_DISTANCE_UNIT_CODE,
  DEFAULT_TIME_ZONE_ID,
} from "@/lib/config";
import { toDateOnly, toTimestampOrNull } from "@/lib/dal/mapping";
import {
  PLACEHOLDER_BIRTH_DATE,
  type Athlete,
  type CompleteProfileInput,
  type IAthleteAccess,
  type ProvisionAthleteInput,
} from "@/lib/dal/athlete/types";

type AthleteRow = {
  AthleteId: number;
  UserId: string | null;
  DistanceUnitId: number;
  Email: string;
  DisplayName: string;
  BirthDate: Date;
  TimeZoneId: string;
  ProfileCompletedAt: Date | null;
};

const ATHLETE_COLUMNS = `AthleteId, UserId, DistanceUnitId, Email, DisplayName,
               BirthDate, TimeZoneId, ProfileCompletedAt`;

// 2601 is a duplicate key row in a unique index, 2627 a unique constraint
// violation. Two requests can race to provision the same user; the filtered
// unique index UX_Athlete_UserId settles it and the loser re-reads rather than
// failing the sign-in.
const DUPLICATE_KEY_ERROR_NUMBERS = new Set([2601, 2627]);

function isDuplicateKeyError(error: unknown): boolean {
  if (error === null || typeof error !== "object" || !("number" in error)) {
    return false;
  }
  const errorNumber = Number((error as { number: unknown }).number);
  return DUPLICATE_KEY_ERROR_NUMBERS.has(errorNumber);
}

function toAthlete(row: AthleteRow): Athlete {
  return {
    athleteId: row.AthleteId,
    userId: row.UserId,
    distanceUnitId: row.DistanceUnitId,
    email: row.Email,
    displayName: row.DisplayName,
    birthDate: toDateOnly(row.BirthDate),
    timeZoneId: row.TimeZoneId,
    profileCompletedAt: toTimestampOrNull(row.ProfileCompletedAt),
    isProfileComplete: row.ProfileCompletedAt !== null,
  };
}

async function findRowByUserId(userId: string): Promise<AthleteRow | null> {
  const result = await executeQuery((request) =>
    request.input("userId", sql.NVarChar(50), userId).query<AthleteRow>(`
      SELECT ${ATHLETE_COLUMNS}
      FROM training.Athlete
      WHERE UserId = @userId
    `)
  );
  return result.recordset[0] ?? null;
}

async function findUnclaimedRowByEmail(email: string): Promise<AthleteRow | null> {
  const result = await executeQuery((request) =>
    request.input("email", sql.NVarChar(256), email).query<AthleteRow>(`
      SELECT ${ATHLETE_COLUMNS}
      FROM training.Athlete
      WHERE Email = @email AND UserId IS NULL
    `)
  );
  return result.recordset[0] ?? null;
}

async function resolveDefaultDistanceUnitId(): Promise<number> {
  const result = await executeQuery((request) =>
    request
      .input("code", sql.VarChar(20), DEFAULT_DISTANCE_UNIT_CODE)
      .query<{ DistanceUnitId: number }>(`
        SELECT TOP 1 DistanceUnitId
        FROM training.DistanceUnit
        ORDER BY CASE WHEN Code = @code THEN 0 ELSE 1 END, DistanceUnitId
      `)
  );

  const row = result.recordset[0];
  if (row === undefined) {
    throw new Error(
      "training.DistanceUnit is empty. Run the seed data in sql/001_initial_schema.sql before signing in."
    );
  }
  return row.DistanceUnitId;
}

async function claimRowForUser(athleteId: number, userId: string): Promise<AthleteRow> {
  const result = await executeQuery((request) =>
    request
      .input("athleteId", sql.Int, athleteId)
      .input("userId", sql.NVarChar(50), userId)
      .query<AthleteRow>(`
        UPDATE training.Athlete
        SET UserId = @userId, UpdatedAt = SYSUTCDATETIME()
        WHERE AthleteId = @athleteId;

        SELECT ${ATHLETE_COLUMNS}
        FROM training.Athlete
        WHERE AthleteId = @athleteId;
      `)
  );
  return result.recordset[0];
}

async function insertRow(input: ProvisionAthleteInput): Promise<AthleteRow> {
  const distanceUnitId = await resolveDefaultDistanceUnitId();
  const hasDisplayName = input.displayName.trim() !== "";
  const displayName = hasDisplayName ? input.displayName : input.email;

  const result = await executeQuery((request) =>
    request
      .input("userId", sql.NVarChar(50), input.userId)
      .input("distanceUnitId", sql.Int, distanceUnitId)
      .input("email", sql.NVarChar(256), input.email)
      .input("displayName", sql.NVarChar(100), displayName)
      .input("birthDate", sql.Date, PLACEHOLDER_BIRTH_DATE)
      .input("timeZoneId", sql.NVarChar(100), DEFAULT_TIME_ZONE_ID)
      .query<AthleteRow>(`
        INSERT INTO training.Athlete
            (UserId, DistanceUnitId, Email, DisplayName, BirthDate, TimeZoneId)
        VALUES
            (@userId, @distanceUnitId, @email, @displayName, @birthDate, @timeZoneId);

        SELECT ${ATHLETE_COLUMNS}
        FROM training.Athlete
        WHERE AthleteId = SCOPE_IDENTITY();
      `)
  );
  return result.recordset[0];
}

export const sqlAthleteAccess: IAthleteAccess = {
  async hasAppGrant(userId: string): Promise<boolean> {
    try {
      const result = await executeQuery((request) =>
        request
          .input("userId", sql.NVarChar(sql.MAX), userId)
          .input("appName", sql.NVarChar(500), APP_NAME)
          .query<{ Granted: number }>(`
            SELECT TOP 1 1 AS Granted
            FROM dbo.AppAccess
            WHERE UserId = @userId AND AppName = @appName
          `)
      );
      return result.recordset.length > 0;
    } catch (err) {
      console.error("[DAL] athlete.hasAppGrant failed", { err });
      throw err;
    }
  },

  async findByUserId(userId: string): Promise<Athlete | null> {
    try {
      const row = await findRowByUserId(userId);
      return row === null ? null : toAthlete(row);
    } catch (err) {
      console.error("[DAL] athlete.findByUserId failed", { err });
      throw err;
    }
  },

  async provision(input: ProvisionAthleteInput): Promise<Athlete> {
    try {
      const existing = await findRowByUserId(input.userId);
      if (existing !== null) {
        return toAthlete(existing);
      }

      // An athlete seeded by hand before the login existed is claimed rather
      // than duplicated, which would violate UQ_Athlete_Email anyway.
      const unclaimed = await findUnclaimedRowByEmail(input.email);
      if (unclaimed !== null) {
        return toAthlete(await claimRowForUser(unclaimed.AthleteId, input.userId));
      }

      return toAthlete(await insertRow(input));
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        const winner = await findRowByUserId(input.userId);
        if (winner !== null) {
          return toAthlete(winner);
        }
      }
      console.error("[DAL] athlete.provision failed", { err });
      throw err;
    }
  },

  async completeProfile(
    athleteId: number,
    input: CompleteProfileInput
  ): Promise<Athlete> {
    try {
      const result = await executeQuery((request) =>
        request
          .input("athleteId", sql.Int, athleteId)
          .input("birthDate", sql.Date, input.birthDate)
          .input("timeZoneId", sql.NVarChar(100), input.timeZoneId)
          .input("distanceUnitId", sql.Int, input.distanceUnitId)
          .query<AthleteRow>(`
            UPDATE training.Athlete
            SET BirthDate          = @birthDate,
                TimeZoneId         = @timeZoneId,
                DistanceUnitId     = @distanceUnitId,
                ProfileCompletedAt = SYSUTCDATETIME(),
                UpdatedAt          = SYSUTCDATETIME()
            WHERE AthleteId = @athleteId;

            SELECT ${ATHLETE_COLUMNS}
            FROM training.Athlete
            WHERE AthleteId = @athleteId;
          `)
      );
      return toAthlete(result.recordset[0]);
    } catch (err) {
      console.error("[DAL] athlete.completeProfile failed", { err });
      throw err;
    }
  },
};
