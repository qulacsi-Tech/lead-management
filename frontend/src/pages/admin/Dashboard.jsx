import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

export default function AdminDashboard() {
  const { institutes, students, mentors, refreshAdminData } = useData();

  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  // Combine all registered entities into a unified recent activity feed
  const recentRegistrations = [
    ...institutes.map((i) => ({ ...i, entityType: 'Institute', icon: 'account_balance', badgeVariant: 'primary' })),
    ...students.map((s) => ({ ...s, entityType: 'Student', icon: 'school', badgeVariant: 'tertiary' })),
    ...mentors.map((m) => ({ ...m, entityType: 'Mentor', icon: 'person', badgeVariant: 'success' })),
  ].sort((a, b) => (b.registeredAt || 0) - (a.registeredAt || 0));

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-3xl p-8 mb-8 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-300">verified_user</span>
              <span className="text-xs uppercase tracking-wider font-semibold opacity-90">System Administrative Portal</span>
            </div>
            <h1 className="font-display text-3xl font-bold m-0">Platform Overview & Management</h1>
            <p className="text-sm opacity-90 mt-2 m-0 max-w-2xl">
              Monitor system growth, manage institutes, students, and mentors. All new registrations are automatically approved and listed below.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-xs opacity-75 m-0 font-medium">Auto-Approval Status</p>
              <p className="text-sm font-bold m-0">Active & Automated</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon="account_balance"
          title="Registered Institutes"
          value={institutes.length}
          trend="+100% Auto-Approved"
        />
        <StatCard
          icon="school"
          title="Active Students"
          value={students.length}
          trend="+100% Auto-Approved"
        />
        <StatCard
          icon="person"
          title="Active Mentors"
          value={mentors.length}
          trend="+100% Auto-Approved"
        />
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/institutes" className="no-underline">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border border-outline-variant h-full flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-2xl">account_balance</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface m-0 mb-1">Manage Institutes</h3>
              <p className="text-xs text-on-surface-variant m-0">
                View, filter, edit courses offered, credits, and active status for all partner institutes.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-primary gap-1">
              View {institutes.length} Institutes <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </Card>
        </Link>

        <Link to="/admin/students" className="no-underline">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border border-outline-variant h-full flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface m-0 mb-1">Manage Students</h3>
              <p className="text-xs text-on-surface-variant m-0">
                Monitor student registrations, referral submissions, career profile details, and points.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-emerald-700 gap-1">
              View {students.length} Students <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </Card>
        </Link>

        <Link to="/admin/mentors" className="no-underline">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border border-outline-variant h-full flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 mb-4">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface m-0 mb-1">Manage Mentors</h3>
              <p className="text-xs text-on-surface-variant m-0">
                Review expert profiles, domain specializations, mock tests published, and impact metrics.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-violet-700 gap-1">
              View {mentors.length} Mentors <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Activity Table Feed */}
      <Card className="p-6 border border-outline-variant">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-on-surface m-0">Recent Auto-Approved Registrations</h2>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Users automatically added to the system without requiring manual intervention
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Auto-Approval Enabled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant text-xs text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Email / Contact</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Approval Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {recentRegistrations.slice(0, 8).map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary text-sm font-bold">
                        <span className="material-symbols-outlined text-base">{item.icon}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface m-0">{item.name}</p>
                        <p className="text-xs text-on-surface-variant m-0">{item.city || item.company || item.domain || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-xs">
                    <Badge tone={item.badgeVariant}>{item.entityType}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant font-mono">{item.email}</td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                    {new Date(item.registeredAt || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge tone="success">Auto-Approved</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
