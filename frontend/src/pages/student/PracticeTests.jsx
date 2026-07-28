import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { fetchPapers, ApiError } from '../../Api/Api';

const BANDS = [
  'from-primary to-primary-container',
  'from-secondary to-on-secondary-container',
  'from-tertiary-container to-tertiary',
  'from-primary to-secondary',
  'from-primary-container to-tertiary-container',
];
const bandFor = (id) => BANDS[Math.abs(String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % BANDS.length];

export default function PracticeTests() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPapers();
        setPapers(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load practice tests.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visiblePapers = filter === 'all' ? papers : papers.filter((p) => p.question_count > 0);

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <div className="flex justify-between items-end gap-6 flex-wrap mb-8">
        <div>
          <span className="text-primary font-bold tracking-wider text-xs uppercase mb-2 block">
            Practice Library
          </span>
          <h2 className="font-display text-3xl font-bold text-primary m-0">Sample Papers from Top Mentors</h2>
          <p className="text-on-surface-variant m-0 mt-2">Board-exam style mock papers created by mentors for you to test yourself with.</p>
        </div>
        <div className="flex bg-primary-fixed rounded-xl p-1 gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none ${
              filter === 'all' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'bg-transparent text-on-surface-variant'
            }`}
          >
            All Papers
          </button>
          <button
            onClick={() => setFilter('takeable')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none ${
              filter === 'takeable' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'bg-transparent text-on-surface-variant'
            }`}
          >
            Has Questions
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-on-surface-variant text-sm">Loading...</p>
      ) : visiblePapers.length === 0 ? (
        <p className="text-on-surface-variant text-sm">No papers available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visiblePapers.map((p) => (
            <Card key={p.id} className="overflow-hidden flex flex-col">
              <div className={`h-24 bg-gradient-to-br ${bandFor(p.id)} relative flex items-center px-4`}>
                <span className="material-symbols-outlined text-white text-3xl opacity-90">description</span>
                <span className="absolute top-3 right-3 bg-white/90 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">
                  {p.subject}
                </span>
              </div>
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div>
                  <h4 className="text-sm font-semibold m-0 mb-1">{p.title}</h4>
                  <p className="text-xs text-on-surface-variant m-0">
                    By {p.mentor_name || 'Mentor'} · {p.downloads} attempt{p.downloads === 1 ? '' : 's'}
                  </p>
                </div>
                <p className="text-xs text-on-surface-variant m-0">{p.question_count} question{p.question_count === 1 ? '' : 's'}</p>
                <div className="mt-auto pt-2">
                  <button
                    onClick={() => navigate(`/student/practice-tests/${p.id}`)}
                    disabled={p.question_count === 0}
                    className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-xs cursor-pointer border-none flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">play_arrow</span>
                    {p.question_count === 0 ? 'No Questions Yet' : 'Start Test'}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
