import Card from './Card';

export default function StatCard({ icon, iconBg, iconColor, label, value, trend, className = '' }) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: iconBg, color: iconColor }}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-secondary text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs text-on-surface-variant mb-0.5">{label}</p>
      <h3 className="text-2xl font-bold text-on-surface">{value}</h3>
    </Card>
  );
}
