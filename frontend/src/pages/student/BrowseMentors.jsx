import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { fetchMentors, followMentor, unfollowMentor, ApiError } from '../../Api/Api';

export default function BrowseMentors() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMentors();
        setMentors(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load mentors.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleFollow = async (mentor) => {
    setPendingId(mentor.id);
    try {
      if (mentor.is_following) {
        await unfollowMentor(mentor.id);
        setMentors((prev) =>
          prev.map((m) => (m.id === mentor.id ? { ...m, is_following: false, followers_count: Math.max(0, m.followers_count - 1) } : m))
        );
      } else {
        await followMentor(mentor.id);
        setMentors((prev) =>
          prev.map((m) => (m.id === mentor.id ? { ...m, is_following: true, followers_count: m.followers_count + 1 } : m))
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed. Try again.');
    } finally {
      setPendingId(null);
    }
  };

  const visibleMentors = search
    ? mentors.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || (m.domain || '').toLowerCase().includes(search.toLowerCase()))
    : mentors;

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <div className="flex justify-between items-end gap-6 flex-wrap mb-8">
        <div>
          <span className="text-primary font-bold tracking-wider text-xs uppercase mb-2 block">
            Mentor Directory
          </span>
          <h2 className="font-display text-3xl font-bold text-primary m-0">Browse Mentors</h2>
          <p className="text-on-surface-variant m-0 mt-2">Find a mentor and follow them to access their papers and updates.</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or domain..."
          className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm min-w-[260px]"
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-on-surface-variant text-sm">Loading...</p>
      ) : visibleMentors.length === 0 ? (
        <p className="text-on-surface-variant text-sm">No mentors found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibleMentors.map((m) => (
            <Card key={m.id} className="overflow-hidden flex flex-col">
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold m-0">{m.name}</h5>
                    <p className="text-xs text-on-surface-variant m-0">{m.domain || 'General'}{m.company ? ` · ${m.company}` : ''}</p>
                  </div>
                </div>
                {m.subjects?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.subjects.slice(0, 3).map((s) => (
                      <span key={s} className="text-[10px] font-bold px-2 py-1 rounded bg-surface-container-high text-on-surface-variant uppercase">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-on-surface-variant m-0">{m.followers_count} follower{m.followers_count === 1 ? '' : 's'}</p>
                <div className="mt-auto pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/student/mentors/${m.id}`)}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant={m.is_following ? 'soft' : 'secondary'}
                    size="sm"
                    className="flex-1"
                    disabled={pendingId === m.id}
                    onClick={() => toggleFollow(m)}
                  >
                    {m.is_following ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
