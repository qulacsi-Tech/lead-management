import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { mockPurchasedHistory } from './mockData';
import PageHeader from './PageHeader';

export default function PurchasedHistory() {
  const [rows, setRows] = useState(mockPurchasedHistory);

  const toggleInterested = (id) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, interested: !r.interested } : r)));

  return (
    <div>
      <PageHeader
        title="Purchased History / My Buy Lead"
        subtitle="Download, export to Excel, or mark a lead as interested to push it to any company CRM."
      />

      <div className="flex gap-2 mb-4">
        <Button variant="soft" size="sm" icon="download">Download</Button>
        <Button variant="soft" size="sm" icon="table_view">Export to Excel</Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-outline-variant text-on-surface-variant">
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Type</th>
              <th className="p-3 font-semibold">Purchased On</th>
              <th className="p-3 font-semibold">Credits Spent</th>
              <th className="p-3 font-semibold">Interested?</th>
              <th className="p-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-outline-variant last:border-0">
                <td className="p-3 text-on-surface font-semibold">{r.name}</td>
                <td className="p-3">
                  <Badge tone={r.type === 'Job Lead' ? 'tertiary' : 'success'}>{r.type}</Badge>
                </td>
                <td className="p-3 text-on-surface-variant">{r.purchasedOn}</td>
                <td className="p-3 text-on-surface-variant">{r.credits}</td>
                <td className="p-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={r.interested}
                      onChange={() => toggleInterested(r.id)}
                    />
                    {r.interested ? 'Yes' : 'No'}
                  </label>
                </td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="cloud_upload"
                    disabled={!r.interested}
                  >
                    Push to CRM
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
