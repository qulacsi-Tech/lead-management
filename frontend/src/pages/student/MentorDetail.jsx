import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { fetchMentorById, fetchPapers, followMentor, unfollowMentor, ApiError } from '../../Api/Api';

export default function MentorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [mentorData, paperData] = await Promise.all([
          fetchMentorById(id),
          fetchPapers({ mentor_id: id }),
        ]);
        setMentor(mentorData);
        setFollowing(mentorData.is_following);
        setPapers(paperData);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load mentor.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const toggleFollow = async () => {
    setPending(true);
    try {
      if (following) {
        await unfollowMentor(id);
        setFollowing(false);
        setMentor((m) => (m ? { ...m, followers_count: Math.max(0, m.followers_count - 1) } : m));
      } else {
        await followMentor(id);
        setFollowing(true);
        setMentor((m) => (m ? { ...m, followers_count: m.followers_count + 1 } : m));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed. Try again.');
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl w-full mx-auto px-10 py-8"><p className="text-on-surface-variant text-sm">Loading...</p></div>;
  }

  if (error && !mentor) {
    return (
      <div className="max-w-5xl w-full mx-auto px-10 py-8">
        <div className="px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-10 py-8 box-border">
      <button
        onClick={() => navigate('/student/mentors')}
        className="bg-transparent border-none text-primary text-sm cursor-pointer hover:underline mb-4 p-0 flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Back to Mentors
      </button>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xl">
              {mentor.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-primary m-0">{mentor.name}</h2>
              <p className="text-sm text-on-surface-variant m-0 mt-1">
                {mentor.title || mentor.domain || 'Mentor'}{mentor.company ? ` at ${mentor.company}` : ''}
              </p>
              <p className="text-xs text-on-surface-variant m-0 mt-1">{mentor.followers_count} follower{mentor.followers_count === 1 ? '' : 's'}</p>
            </div>
          </div>
          <Button variant={following ? 'soft' : 'secondary'} disabled={pending} onClick={toggleFollow}>
            {following ? 'Following' : 'Follow Mentor'}
          </Button>
        </div>

        {mentor.about && <p className="text-sm text-on-surface-variant mt-4 mb-0">{mentor.about}</p>}

        {mentor.subjects?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {mentor.subjects.map((s) => (
              <span key={s} className="text-[10px] font-bold px-2 py-1 rounded bg-surface-container-high text-on-surface-variant uppercase">
                {s}
              </span>
            ))}
          </div>
        )}

        {mentor.highlights?.length > 0 && (
          <div className="mt-5 flex flex-col gap-3">
            {mentor.highlights.map((h, idx) => (
              <div key={idx} className="border-l-4 border-primary pl-3">
                <p className="text-sm font-semibold m-0">{h.title}</p>
                {h.org_period && <p className="text-xs text-on-surface-variant m-0">{h.org_period}</p>}
                {h.description && <p className="text-xs text-on-surface-variant m-0 mt-1">{h.description}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <h4 className="font-display text-xl font-semibold mb-3">Published Papers</h4>
      {papers.length === 0 ? (
        <p className="text-on-surface-variant text-sm">This mentor hasn't published any papers yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {papers.map((p) => (
            <Card key={p.id} className="overflow-hidden flex flex-col">
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-surface-container-high text-primary uppercase">{p.subject}</span>
                  <h5 className="text-sm font-semibold m-0 mt-2">{p.title}</h5>
                </div>
                <p className="text-xs text-on-surface-variant m-0">{p.question_count} question{p.question_count === 1 ? '' : 's'} · {p.downloads} attempt{p.downloads === 1 ? '' : 's'}</p>
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
