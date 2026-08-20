import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { fetchAdminEnquiries, ApiError } from '../../Api/Api';

export default function ManageEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAdminEnquiries();
        setEnquiries(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load enquiries.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = enquiries.filter((e) =>
    e.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <div className="flex justify-between items-end gap-6 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold m-0 mb-2">All Enquiries</h2>
          <p className="text-on-surface-variant m-0 text-sm max-w-2xl">
            Platform-wide oversight of student enquiries and how many institutes match their state.
            Responding to an enquiry belongs to the institute it was sent to — each Institute Admin
            handles their own in their console.
          </p>
        </div>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by student, state, or course..."
          className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm min-w-[260px]"
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-on-surface-variant text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-on-surface-variant text-sm">No enquiries found.</Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-5 py-3.5 text-xs text-outline font-semibold">Student</th>
                <th className="px-5 py-3.5 text-xs text-outline font-semibold">Type</th>
                <th className="px-5 py-3.5 text-xs text-outline font-semibold">State</th>
                <th className="px-5 py-3.5 text-xs text-outline font-semibold">Course</th>
                <th className="px-5 py-3.5 text-xs text-outline font-semibold">Submitted</th>
                <th className="px-5 py-3.5 text-xs text-outline font-semibold text-right">Matching Institutes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-surface-container">
                  <td className="px-5 py-3.5 text-sm font-semibold">{e.student_name}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-primary">
                      {e.enquiry_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-on-surface-variant">{e.state}</td>
                  <td className="px-5 py-3.5 text-sm text-on-surface-variant">{e.course}</td>
                  <td className="px-5 py-3.5 text-xs text-on-surface-variant">
                    {e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      e.matching_institutes > 0 ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {e.matching_institutes}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
