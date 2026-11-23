"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  Select,
  Textarea,
} from "@parkerburgess/wandering-parker-ui";
import type { ActivityFormDto } from "@/dto";

type Props = {
  activities: ActivityFormDto[];
  sportOptions: string[];
};

type RecordFieldsProps = {
  activity: ActivityFormDto;
  sportOptions: string[];
};

/**
 * One existing activity's fields, prefilled and editable. Uncontrolled on
 * purpose: nothing reads these back yet, and defaultValue is what lets them be
 * typed into without a change handler that would have nowhere to send the
 * value.
 */
function ActivityRecordFields({ activity, sportOptions }: RecordFieldsProps) {
  const fieldIdPrefix = `activity-${activity.id}`;

  // #region Tailwind utility consts
  const recordCls = "grid gap-3 rounded-lg border border-neutral-400 p-4";
  const fieldGridCls = "grid grid-cols-2 gap-3";
  const notesCls = "placeholder-neutral-400";
  // #endregion

  return (
    <div className={recordCls}>
      <div className={fieldGridCls}>
        <Input
          id={`${fieldIdPrefix}-started-at`}
          label="Started at"
          type="datetime-local"
          defaultValue={activity.startedAt}
        />
        <Select
          id={`${fieldIdPrefix}-sport`}
          label="Sport"
          options={sportOptions}
          defaultValue={activity.sportName}
        />
        <Input
          id={`${fieldIdPrefix}-duration`}
          label="Duration (min)"
          type="number"
          defaultValue={activity.durationMinutes}
        />
        <Input
          id={`${fieldIdPrefix}-distance`}
          label="Distance (m)"
          type="number"
          step="0.01"
          defaultValue={activity.distanceMeters}
        />
        <Input
          id={`${fieldIdPrefix}-avg-hr`}
          label="HR avg"
          type="number"
          defaultValue={activity.averageHeartRate}
        />
        <Input
          id={`${fieldIdPrefix}-max-hr`}
          label="HR max"
          type="number"
          defaultValue={activity.maxHeartRate}
        />
      </div>
      <Textarea
        id={`${fieldIdPrefix}-notes`}
        label="Notes"
        rows={2}
        className={notesCls}
        defaultValue={activity.notes}
      />
    </div>
  );
}

/**
 * The activity panel's entry point, split out as a client component so
 * ActivityPanel and every ActivityCard stay server-rendered — the modal's open
 * state is the only thing here that needs the client.
 *
 * Display only. Both action buttons are disabled because nothing writes
 * training.Activity yet.
 */
export default function AddEditActivityModal({
  activities,
  sportOptions,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const mostRecentFirst = [...activities].sort((left, right) =>
    right.startedAt.localeCompare(left.startedAt)
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
  // The two sections the modal is built from, plus its own header.
  const layoutCls = "grid gap-6";
  const headerCls = "grid grid-cols-[1fr_auto] items-center gap-4";
  const titleCls = "text-base font-semibold text-neutral-900";
  const sectionCls = "grid gap-3";
  const sectionHeadingCls =
    "text-xs font-semibold uppercase tracking-wide text-neutral-500";
  const fieldGridCls = "grid grid-cols-2 gap-3";
  const notesCls = "placeholder-neutral-400";
  // Capped so the new-entry section above it cannot be scrolled out of reach
  // once the history grows.
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
          ariaLabel="Add or edit activity data"
        >
          <div className={layoutCls}>
            <header className={headerCls}>
              <h2 className={titleCls}>Activity data</h2>
              <Button
                variant="secondary"
                className={closeBtnCls}
                onClick={handleClose}
              >
                Close
              </Button>
            </header>

            <section className={sectionCls}>
              <h3 className={sectionHeadingCls}>Add an activity</h3>

              <div className={fieldGridCls}>
                <Input
                  id="new-activity-started-at"
                  label="Started at"
                  type="datetime-local"
                />
                <Select
                  id="new-activity-sport"
                  label="Sport"
                  options={sportOptions}
                />
                <Input
                  id="new-activity-duration"
                  label="Duration (min)"
                  type="number"
                  placeholder="minutes"
                />
                <Input
                  id="new-activity-distance"
                  label="Distance (m)"
                  type="number"
                  step="0.01"
                  placeholder="meters"
                />
                <Input
                  id="new-activity-avg-hr"
                  label="HR avg"
                  type="number"
                  placeholder="bpm"
                />
                <Input
                  id="new-activity-max-hr"
                  label="HR max"
                  type="number"
                  placeholder="bpm"
                />
              </div>
              <Textarea
                id="new-activity-notes"
                label="Notes"
                rows={2}
                className={notesCls}
                placeholder="notes"
              />

              <div className={actionsCls}>
                <Button variant="primary" disabled>
                  Add activity
                </Button>
              </div>
            </section>

            <section className={sectionCls}>
              <h3 className={sectionHeadingCls}>Recorded activities</h3>

              {mostRecentFirst.length === 0 ? (
                <p className={emptyCls}>No activities yet.</p>
              ) : (
                <div className={recordListCls}>
                  {mostRecentFirst.map((activity) => (
                    <ActivityRecordFields
                      key={activity.id}
                      activity={activity}
                      sportOptions={sportOptions}
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
