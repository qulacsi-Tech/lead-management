import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { fetchMyFollowing, unfollowMentor, ApiError } from '../../Api/Api';

export default function MyMentors() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMyFollowing();
        setMentors(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load your mentors.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUnfollow = async (mentorId) => {
    setPendingId(mentorId);
    try {
      await unfollowMentor(mentorId);
      setMentors((prev) => prev.filter((m) => m.id !== mentorId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed. Try again.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <div className="mb-8">
        <span className="text-primary font-bold tracking-wider text-xs uppercase mb-2 block">
          Following
        </span>
        <h2 className="font-display text-3xl font-bold text-primary m-0">My Mentors</h2>
        <p className="text-on-surface-variant m-0 mt-2">Mentors you follow, and quick access to their papers.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-on-surface-variant text-sm">Loading...</p>
      ) : mentors.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-on-surface-variant text-sm mb-4">You're not following any mentors yet.</p>
          <Button variant="secondary" onClick={() => navigate('/student/mentors')}>Browse Mentors</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mentors.map((m) => (
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
                <div className="mt-auto pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/student/mentors/${m.id}`)}
                  >
                    View Papers
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    disabled={pendingId === m.id}
                    onClick={() => handleUnfollow(m.id)}
                  >
                    Unfollow
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
