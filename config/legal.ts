// All legal wording lives here so the attorney's final text can drop in.
// PLACEHOLDER — not reviewed by the attorney yet.

export const legal = {
  // Check-up report: work approved in the home gets Ohio's 3-business-day right to cancel.
  checkupApproval:
    'Pay after the work is done with the card on file. You may cancel within 3 business days; the cancellation notice is emailed to you with a copy of this approval. [Attorney to confirm wording]',

  // Service call: emergency same-visit repair uses waiver wording.
  emergencyWaiver:
    "Paid on the tech's device when the work is done. Emergency repair: you may waive the 3-day cancellation period for work done today. [Attorney to confirm wording]",

  // Shown when a non-member joins on the estimate approve screen.
  membershipTerms: (monthly: number, firstTermMonths: number) =>
    `starts today: $${monthly}/month, first term ${firstTermMonths} months, then month to month.`,
}
