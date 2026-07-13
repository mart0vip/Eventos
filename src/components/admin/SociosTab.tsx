"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { adminFetch } from "@/lib/adminSecret";
import { DebtConcept, Member } from "@/types/member";

type MemberRow = Member & { pendingTotalArs: number };

interface SociosTabProps {
  secret: string;
}

const CONCEPTS: DebtConcept[] = ["cuota", "pension", "ropero", "otro"];

const CONCEPT_KEYS: Record<DebtConcept, string> = {
  cuota: "socios.conceptCuota",
  pension: "socios.conceptPension",
  ropero: "socios.conceptRopero",
  otro: "socios.conceptOtro",
};

export default function SociosTab({ secret }: SociosTabProps) {
  const { t } = useLanguage();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Alta de socio
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [memberError, setMemberError] = useState(false);

  // Carga de deuda
  const [debtMemberId, setDebtMemberId] = useState("");
  const [concept, setConcept] = useState<DebtConcept>("cuota");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const refresh = useCallback(() => {
    return adminFetch("/api/members", secret)
      .then((res) => (res.ok ? res.json() : []))
      .then(setMembers);
  }, [secret]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(false);
    const res = await adminFetch("/api/members", secret, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, memberNumber }),
    });
    if (!res.ok) {
      setMemberError(true);
      return;
    }
    setName("");
    setEmail("");
    setMemberNumber("");
    await refresh();
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtMemberId) return;
    const res = await adminFetch(`/api/members/${debtMemberId}/debts`, secret, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        debts: [
          {
            concept,
            amountArs: Math.round(Number(amount || 0) * 100),
            dueDate,
          },
        ],
      }),
    });
    if (res.ok) {
      setAmount("");
      setDueDate("");
      await refresh();
    }
  };

  const handleCopyLink = async (memberId: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/socios/${memberId}`);
    setCopiedId(memberId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={handleCreateMember} className="bg-white rounded-xl border border-dust/50 p-5 space-y-3">
          <h3 className="font-heading font-bold text-stable">{t("admin.createMemberTitle")}</h3>
          <div>
            <label className="text-sm font-semibold text-stable">{t("admin.memberNameField")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label className="text-sm font-semibold text-stable">{t("admin.memberEmailField")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label className="text-sm font-semibold text-stable">{t("admin.memberNumberField")}</label>
            <input value={memberNumber} onChange={(e) => setMemberNumber(e.target.value)} required className="input-field" />
          </div>
          {memberError && <p className="text-sm text-red-600">{t("admin.memberExists")}</p>}
          <button type="submit" className="btn-primary text-sm py-2">
            {t("admin.createMemberButton")}
          </button>
        </form>

        <form onSubmit={handleAddDebt} className="bg-white rounded-xl border border-dust/50 p-5 space-y-3">
          <h3 className="font-heading font-bold text-stable">{t("admin.addDebtTitle")}</h3>
          <div>
            <label className="text-sm font-semibold text-stable">{t("admin.selectMember")}</label>
            <select value={debtMemberId} onChange={(e) => setDebtMemberId(e.target.value)} required className="input-field">
              <option value="">—</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberNumber} — {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-stable">{t("admin.debtConceptField")}</label>
            <select value={concept} onChange={(e) => setConcept(e.target.value as DebtConcept)} className="input-field">
              {CONCEPTS.map((c) => (
                <option key={c} value={c}>
                  {t(CONCEPT_KEYS[c])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-stable">{t("admin.debtAmountField")}</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label className="text-sm font-semibold text-stable">{t("admin.debtDueDateField")}</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="input-field" />
          </div>
          <button type="submit" disabled={!debtMemberId} className="btn-green text-sm py-2 disabled:opacity-50">
            {t("admin.addDebtButton")}
          </button>
        </form>
      </div>

      {members.length === 0 ? (
        <p className="text-stable-light text-sm">{t("admin.noMembers")}</p>
      ) : (
        <div className="bg-white rounded-xl border border-dust/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stable-light border-b border-dust/30">
                <th className="px-4 py-3 font-semibold">{t("admin.colMemberNumber")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.colMemberName")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.colMemberEmail")}</th>
                <th className="px-4 py-3 font-semibold text-right">{t("admin.colPendingDebt")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-dust/20 last:border-0">
                  <td className="px-4 py-3 text-stable font-medium">{m.memberNumber}</td>
                  <td className="px-4 py-3 text-stable">{m.name}</td>
                  <td className="px-4 py-3 text-stable-light">{m.email}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${m.pendingTotalArs > 0 ? "text-red-600" : "text-forest"}`}>
                    ${(m.pendingTotalArs / 100).toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleCopyLink(m.id)} className="btn-secondary text-sm py-1.5">
                      {copiedId === m.id ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === m.id ? t("admin.portalLinkCopied") : t("admin.copyPortalLink")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
