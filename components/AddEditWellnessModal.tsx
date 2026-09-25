"use client";

import { useState } from "react";
import { Button, Modal } from "@parkerburgess/wandering-parker-ui";

/**
 * The wellness panel's entry point, split out as a client component so
 * WellnessPanel and every DailyWellnessCard stay server-rendered — the modal's
 * open state is the only thing here that needs the client.
 *
 * The modal body is deliberately empty. The form belongs to whichever surface
 * writes training.DailyWellness, and nothing does yet.
 */
export default function AddEditWellnessModal() {
  const [isOpen, setIsOpen] = useState(false);

  function handleOpen() {
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  // #region Tailwind utility consts
  // Full width so the button lines up with the cards below it: Panel's body is
  // a single-column grid, so w-full is exactly the card width.
  const openBtnCls = "w-full cursor-pointer";
  const modalContentCls = "grid justify-items-end";
  const closeBtnCls = "cursor-pointer";
  // #endregion

  return (
    <>
      <Button variant="primary" className={openBtnCls} onClick={handleOpen}>
        Add/Edit Data
      </Button>

      {isOpen && (
        <Modal onClose={handleClose} ariaLabel="Add or edit wellness data">
          <div className={modalContentCls}>
            <Button
              variant="secondary"
              className={closeBtnCls}
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
