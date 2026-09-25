/* ============================================================================
   no-file-no-mile-bro — 006: one DailyWellness row per athlete per day

   training.DailyWellness carried two columns for the same day, RecordedOn
   (DATE) and DailyWellnessDate (DATETIME2), and the unique constraint sat on
   RecordedOn. DailyWellnessDate is now the day and RecordedOn has been
   dropped, which took UQ_DailyWellness_AthleteId_RecordedOn with it and left
   the table with nothing but its primary key. This puts the rule back.

   AthleteId leads the constraint so the backing index also serves the read in
   lib/dal/wellness, which filters on AthleteId and orders by
   DailyWellnessDate.

   Note that DailyWellnessDate is DATETIME2, so this enforces one row per
   athlete per *instant*. It behaves as one row per day only while every value
   is stored at midnight; a stray time component would let two rows share a
   calendar day. Nothing constrains that yet.

   Assumes training.DailyWellness exists and RecordedOn has been dropped.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


ALTER TABLE training.DailyWellness
    ADD CONSTRAINT UQ_DailyWellness_AthleteId_DailyWellnessDate
        UNIQUE (AthleteId, DailyWellnessDate);
GO
