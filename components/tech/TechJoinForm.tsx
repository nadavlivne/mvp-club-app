"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import SignaturePad from "@/components/SignaturePad";
import { techJoin } from "@/app/tech/visit/[id]/join/actions";
import { membership, membershipPrice } from "@/config/business";
import { legal } from "@/config/legal";
import type { JoinData } from "@/lib/join";
import { money } from "@/lib/pricing";

const input =
  "h-12 w-full rounded-lg border border-edge bg-white px-3 text-[17px] outline-none focus:border-navy";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[15px] font-semibold">{label}</span>
      {children}
    </label>
  );
}

export type JoinPrefill = Pick<
  JoinData,
  "firstName" | "lastName" | "street" | "city" | "zip" | "systems"
>;

// One screen the customer fills in and signs on the tech's tablet (about a minute).
export default function TechJoinForm({
  visitId,
  prefill,
  memberCall,
}: {
  visitId: string;
  prefill: JoinPrefill;
  memberCall: string;
}) {
  const [d, setD] = useState<JoinData>({
    ...prefill,
    phone: "",
    email: "",
    plan: "monthly",
    preferredTime: "",
    notes: "",
  });
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof JoinData>(k: K, v: JoinData[K]) =>
    setD((x) => ({ ...x, [k]: v }));
  const priceText = (plan: "monthly" | "yearly") =>
    `${money(membershipPrice(plan, d.systems))}/${plan === "monthly" ? "month" : "year"}`;

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await techJoin(visitId, d, signature, agreed);
      if (!r.ok) return setError(r.error);
      setDone(true);
      window.scrollTo({ top: 0 });
    });
  };

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-success-bg p-5">
          <div className="font-display text-[28px] leading-tight font-bold text-success">
            ✓ {d.firstName} {d.lastName} is signed up
          </div>
          <p className="mt-1 text-body">
            Signed on the tablet. The office sees it in Leads.
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border-2 border-approve bg-white p-5">
          <div className="text-lg font-bold">
            Now take the card in the Housecall Pro app
          </div>
          <ol className="list-decimal pl-5 text-[15px] leading-7 text-body">
            <li>Open the customer in Housecall Pro.</li>
            <li>
              Add the membership:{" "}
              <strong>
                MVP Club — {d.plan === "monthly" ? "monthly" : "yearly"},{" "}
                {priceText(d.plan)}
              </strong>
              {d.systems > 1 && ` (${d.systems} systems)`}.
            </li>
            <li>Take the card and save it.</li>
          </ol>
          <p className="text-sm text-muted">
            This step becomes automatic once the app is connected to Housecall
            Pro.
          </p>
        </div>
        <Link
          href={`/tech/visit/${visitId}`}
          className="flex h-14 items-center justify-center rounded-xl bg-navy text-lg font-bold text-white"
        >
          Back to the visit
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-[15px] text-body">
        Hand the tablet to the customer. Their details from the visit are filled
        in — they check them, add a mobile number, pick a plan and sign.
      </p>
      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-line">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name">
            <input
              className={input}
              value={d.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </Field>
          <Field label="Last name">
            <input
              className={input}
              value={d.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </Field>
          <Field label="Mobile phone">
            <input
              className={input}
              type="tel"
              inputMode="tel"
              value={d.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Email (optional)">
            <input
              className={input}
              type="email"
              value={d.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-[1fr_1fr_110px] gap-3">
          <Field label="Street">
            <input
              className={input}
              value={d.street}
              onChange={(e) => set("street", e.target.value)}
            />
          </Field>
          <Field label="City">
            <input
              className={input}
              value={d.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
          <Field label="Zip">
            <input
              className={input}
              inputMode="numeric"
              maxLength={5}
              value={d.zip}
              onChange={(e) => set("zip", e.target.value.replace(/\D/g, ""))}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-semibold">
            Heating &amp; cooling systems
          </span>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: membership.maxSystems }, (_, i) => i + 1).map(
              (n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("systems", n)}
                  className={`h-12 rounded-lg border-2 text-lg font-bold ${d.systems === n ? "border-navy bg-navy text-white" : "border-line bg-white"}`}
                >
                  {n === membership.maxSystems ? `${n}+` : n}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {(["monthly", "yearly"] as const).map((plan) => (
            <button
              key={plan}
              type="button"
              onClick={() => set("plan", plan)}
              className={`flex items-center justify-between gap-3 rounded-xl border-2 p-4 text-left ${d.plan === plan ? "border-approve bg-[#FBEDE6]" : "border-line bg-white"}`}
            >
              <span className="flex flex-col">
                <span className="text-lg font-bold">
                  {plan === "monthly" ? "Monthly" : "Yearly"}
                </span>
                <span className="text-sm text-muted">
                  {plan === "monthly"
                    ? `First ${membership.firstTermMonths} months, then month to month`
                    : `Save ${money(membershipPrice("monthly", d.systems) * 12 - membershipPrice("yearly", d.systems))} a year`}
                </span>
              </span>
              <span className="font-display text-2xl font-bold whitespace-nowrap">
                {priceText(plan)}
              </span>
            </button>
          ))}
        </div>
        <div className="text-sm text-body">
          Includes two full-home check-ups a year, {memberCall} service calls,
          15% off repairs and replacement credits after{" "}
          {membership.creditWaitDays} days.
        </div>

        <p className="rounded-lg bg-page p-3 text-sm leading-[1.45] text-body">
          {legal.techJoinTerms(priceText(d.plan), membership.firstTermMonths)}
        </p>
        <label className="flex min-h-11 items-center gap-3 text-[15px] font-semibold">
          <input
            type="checkbox"
            className="size-6 accent-[#B8410F]"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          I agree to the membership terms above
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] font-semibold">
            Customer signs with a finger
          </span>
          <SignaturePad onChange={setSignature} />
        </div>

        {error && (
          <div className="rounded-lg border-2 border-alert p-3 text-[15px] font-semibold text-alert">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="h-14 rounded-xl bg-approve text-lg font-bold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : `Join MVP Club — ${priceText(d.plan)}`}
        </button>
      </div>
    </>
  );
}
