export default function InfoCard({ label, value, detail, accent = "cyan" }) {
  const accentClass = {
    cyan: "from-sky-50 via-white to-cyan-50",
    amber: "from-amber-50 via-white to-orange-50",
    emerald: "from-emerald-50 via-white to-teal-50",
    pink: "from-rose-50 via-white to-pink-50"
  }[accent];
  return (
    <div
      className={`rounded-md border border-slate-200 bg-gradient-to-br ${accentClass} p-4 shadow-board`}
    >
      <p className="eyebrow">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-black">{value}</p>
      <p className="mt-2 text-sm text-black">{detail}</p>
    </div>
  );
}