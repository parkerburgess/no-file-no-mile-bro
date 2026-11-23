import type { DailyWellness, IWellnessAccess } from "@/lib/dal/wellness/types";

/**
 * Three days of made-up Garmin numbers so the wellness layout can be seen
 * before the Garmin pull exists. Only lib/dal/index.ts selects this, and only
 * under the dev bypass, so nothing here reaches the shared database.
 *
 * The third day leaves sleep and weight empty on purpose, to show how the
 * card renders a missing metric.
 */
const MOCK_DAILY_WELLNESS: DailyWellness[] = [
  {
    id: -1,
    dailyWellnessDate: "2026-11-23",
    steps: 11482,
    stepGoal: 10000,
    restingHeartRate: 52,
    maxHeartRate: 131,
    sleepDurationSeconds: 27900, // 7h 45m
    sleepScore: 84,
    bodyWeightKilograms: 79.4, // 175.0 lb
  },
  {
    id: -2,
    dailyWellnessDate: "2026-11-22",
    steps: 6215,
    stepGoal: 10250,
    restingHeartRate: 54,
    maxHeartRate: 118,
    sleepDurationSeconds: 23400, // 6h 30m
    sleepScore: 71,
    bodyWeightKilograms: 79.8, // 175.9 lb
  },
  {
    id: -3,
    dailyWellnessDate: "2026-11-21",
    steps: 9030,
    stepGoal: 10100,
    restingHeartRate: 53,
    maxHeartRate: 142,
    sleepDurationSeconds: null,
    sleepScore: null,
    bodyWeightKilograms: null,
  },
];

export const mockWellnessAccess: IWellnessAccess = {
  async listDailyWellness(): Promise<DailyWellness[]> {
    return MOCK_DAILY_WELLNESS;
  },
};
