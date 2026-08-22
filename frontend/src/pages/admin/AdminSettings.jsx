import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminSettings() {
  const [autoApprove, setAutoApprove] = useState(true);
  const [defaultCredits, setDefaultCredits] = useState(1240);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto flex-1 w-full box-border">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-on-surface m-0">Admin System Settings</h1>
        <p className="text-xs text-on-surface-variant m-0 mt-1">
          Configure platform defaults, registration approval workflow, and prototype parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Auto Approval Card */}
        <Card className="p-6 border border-outline-variant">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                <h3 className="text-base font-bold text-on-surface m-0">Instant Registration Auto-Approval</h3>
              </div>
              <p className="text-xs text-on-surface-variant m-0 max-w-md">
                When enabled, all newly registered Students, Mentors, and Institutes are automatically approved and made active in the platform.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </Card>

        {/* Institute Default Credits */}
        <Card className="p-6 border border-outline-variant">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-on-surface m-0 mb-1">Default Institute Lead Credits</h3>
              <p className="text-xs text-on-surface-variant m-0">
                Initial free lead credits granted to institutes upon automatic registration.
              </p>
            </div>
            <div className="w-40">
              <input
                type="number"
                value={defaultCredits}
                onChange={(e) => setDefaultCredits(Number(e.target.value))}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 font-bold text-primary"
              />
            </div>
          </div>
        </Card>

        {/* Email Alerts */}
        <Card className="p-6 border border-outline-variant">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-on-surface m-0 mb-1">Admin Activity Email Notifications</h3>
              <p className="text-xs text-on-surface-variant m-0">
                Receive instant notifications whenever a new user registers or a lead status changes.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end border-t border-outline-variant pt-6">
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">check_circle</span> Settings Saved!
              </span>
            )}
            <Button type="submit" icon="save">
              Save Settings
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
