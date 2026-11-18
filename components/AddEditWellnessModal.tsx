"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  Select,
  Textarea,
} from "@parkerburgess/wandering-parker-ui";
import type { WellnessFormDto } from "@/dto";

type Props = {
  days: WellnessFormDto[];
  healthRatingNames: string[];
};

type RecordFieldsProps = {
  wellness: WellnessFormDto;
  healthRatingNames: string[];
};

/**
 * One existing row's fields, prefilled and editable. Uncontrolled on purpose:
 * nothing reads these back yet, and defaultValue is what lets them be typed
 * into without a change handler that would have nowhere to send the value.
 */
function WellnessRecordFields({
  wellness,
  healthRatingNames,
}: RecordFieldsProps) {
  const fieldIdPrefix = `wellness-${wellness.id}`;

  // #region Tailwind utility consts
  const recordCls = "grid gap-3 rounded-lg border border-neutral-400 p-4";
  const fieldGridCls = "grid grid-cols-2 gap-3";
  const fullWidthFieldCls = "col-span-2";
  // #endregion

  return (
    <div className={recordCls}>
      <div className={fieldGridCls}>
        <Input
          id={`${fieldIdPrefix}-date`}
          label="Date"
          type="date"
          defaultValue={wellness.date}
        />
        <Input
          id={`${fieldIdPrefix}-resting-hr`}
          label="Resting HR"
          type="number"
          defaultValue={wellness.restingHeartRate}
        />
        <Input
          id={`${fieldIdPrefix}-sleep`}
          label="Sleep (min)"
          type="number"
          defaultValue={wellness.sleepMinutes}
        />
        <Input
          id={`${fieldIdPrefix}-sleep-score`}
          label="Sleep score"
          type="number"
          defaultValue={wellness.sleepScore}
        />
        <Input
          id={`${fieldIdPrefix}-weight`}
          label="Weight (kg)"
          type="number"
          step="0.01"
          defaultValue={wellness.bodyWeightKilograms}
        />
        <Select
          id={`${fieldIdPrefix}-health`}
          label="Health"
          options={healthRatingNames}
          defaultValue={wellness.health}
        />
        <Input
          id={`${fieldIdPrefix}-notes`}
          label="Notes"
          type="text"
          className={fullWidthFieldCls}
          defaultValue={wellness.notes}
          placeholder="No notes"
        />
      </div>
    </div>
  );
}

/**
 * The wellness panel's entry point, split out as a client component so
 * WellnessPanel and every DailyWellnessCard stay server-rendered — the modal's
 * open state is the only thing here that needs the client.
 *
 * Display only. Both action buttons are disabled because nothing writes
 * training.DailyWellness yet.
 */
export default function AddEditWellnessModal({
  days,
  healthRatingNames,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const mostRecentFirst = [...days].sort((left, right) =>
    right.date.localeCompare(left.date)
  );

  function handleOpen() {
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  // #region Tailwind utility consts
  // Full width so the button lines up with the cards below it: the Panel body
  // is a single-column grid, so w-full is exactly the card width.
  const openBtnCls = "w-full cursor-pointer";
  // The two rows the modal is built from, plus its own header.
  const layoutCls = "grid gap-6";
  const headerCls = "grid grid-cols-[1fr_auto] items-center gap-4";
  const titleCls = "text-base font-semibold text-neutral-900";
  const sectionCls = "grid gap-3";
  const sectionHeadingCls =
    "text-xs font-semibold uppercase tracking-wide text-neutral-500";
  const fieldGridCls = "grid grid-cols-2 gap-3";
  const fullWidthFieldCls = "col-span-2";
  // Capped so the new-entry row above it cannot be scrolled out of reach once
  // the history grows.
  const recordListCls = "grid gap-3 max-h-80 overflow-y-auto pr-1";
  const emptyCls =
    "rounded-lg border border-dashed border-neutral-300 p-4 text-sm " +
    "text-neutral-500";
  const actionsCls = "grid justify-items-end";
  const noteCls = "text-xs text-neutral-500";
  const closeBtnCls = "cursor-pointer";
  // #endregion

  return (
    <>
      <Button variant="primary" className={openBtnCls} onClick={handleOpen}>
        Add/Edit Data
      </Button>

      {isOpen && (
        <Modal
          onClose={handleClose}
          size="lg"
          ariaLabel="Add or edit wellness data"
        >
          <div className={layoutCls}>
            <header className={headerCls}>
              <h2 className={titleCls}>Wellness data</h2>
              <Button
                variant="secondary"
                className={closeBtnCls}
                onClick={handleClose}
              >
                Close
              </Button>
            </header>

            <section className={sectionCls}>
              <h3 className={sectionHeadingCls}>Add a new day</h3>

              <div className={fieldGridCls}>
                <Input id="new-wellness-date" label="Date" type="date" />
                <Input
                  id="new-wellness-resting-hr"
                  label="Resting HR"
                  type="number"
                  placeholder="bpm"
                />
                <Input
                  id="new-wellness-sleep"
                  label="Sleep (min)"
                  type="number"
                  placeholder="minutes"
                />
                <Input
                  id="new-wellness-sleep-score"
                  label="Sleep score"
                  type="number"
                  placeholder="0-100"
                />
                <Input
                  id="new-wellness-weight"
                  label="Weight (kg)"
                  type="number"
                  step="0.01"
                  placeholder="kg"
                />
                <Select
                  id="new-wellness-health"
                  label="Health"
                  options={healthRatingNames}
                />
                <Textarea
                  id="new-wellness-notes"
                  label="Notes"
                  rows={2}
                  className={fullWidthFieldCls}
                  placeholder="How the day went"
                />
              </div>

              <div className={actionsCls}>
                <Button variant="primary" disabled>
                  Add day
                </Button>
              </div>
            </section>

            <section className={sectionCls}>
              <h3 className={sectionHeadingCls}>Recorded days</h3>

              {mostRecentFirst.length === 0 ? (
                <p className={emptyCls}>No wellness entries recorded yet.</p>
              ) : (
                <div className={recordListCls}>
                  {mostRecentFirst.map((day) => (
                    <WellnessRecordFields
                      key={day.id}
                      wellness={day}
                      healthRatingNames={healthRatingNames}
                    />
                  ))}
                </div>
              )}

              <div className={actionsCls}>
                <Button variant="primary" disabled>
                  Save changes
                </Button>
              </div>
            </section>

            <p className={noteCls}>
              Display only for now — nothing here is saved.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
