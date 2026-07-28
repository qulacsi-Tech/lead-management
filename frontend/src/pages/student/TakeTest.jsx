import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { fetchPaperById, submitPaperAttempt, ApiError } from '../../Api/Api';

export default function TakeTest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPaperById(id);
        setPaper(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load paper.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="max-w-3xl w-full mx-auto px-10 py-16 box-border text-center text-on-surface-variant">Loading...</div>;
  }

  if (!paper || error) {
    return (
      <div className="max-w-3xl w-full mx-auto px-10 py-16 box-border text-center">
        <p className="text-on-surface-variant mb-4">{error || "That practice test couldn't be found."}</p>
        <Link to="/student/practice-tests"><Button>Back to Practice Tests</Button></Link>
      </div>
    );
  }

  const questions = paper.questions || [];
  const selectAnswer = (qIndex, optIndex) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const answerList = questions.map((_, i) => answers[i]);
      const res = await submitPaperAttempt(paper.id, answerList);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit answers.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto px-10 py-8 box-border">
      <div className="mb-6">
        <span className="text-primary font-bold tracking-wider text-xs uppercase mb-2 block">{paper.subject}</span>
        <h2 className="font-display text-2xl font-bold text-primary m-0">{paper.title}</h2>
        <p className="text-on-surface-variant m-0 mt-1">By {paper.mentor_name || 'Mentor'}</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      {result ? (
        <Card className="p-8 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-secondary">military_tech</span>
          <h3 className="font-display text-2xl font-bold m-0">
            You scored {result.score} / {result.total}
          </h3>
          <p className="text-on-surface-variant m-0">
            {result.score === result.total ? 'Perfect score — well done!' : 'Review the paper again to sharpen your weak spots.'}
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => { setAnswers({}); setResult(null); }}>Retake</Button>
            <Button onClick={() => navigate('/student/practice-tests')}>Back to Practice Tests</Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {questions.map((q, qi) => (
            <Card key={q.id} className="p-6">
              <p className="font-semibold text-sm m-0 mb-4">{qi + 1}. {q.question_text}</p>
              <div className="flex flex-col gap-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => selectAnswer(qi, oi)}
                    className={`text-left px-4 py-2.5 rounded-lg text-sm border cursor-pointer transition-all ${
                      answers[qi] === oi
                        ? 'border-primary bg-primary-fixed text-primary font-semibold'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Card>
          ))}
          <Button disabled={!allAnswered || submitting} onClick={handleSubmit} size="lg">
            {submitting ? 'Submitting...' : allAnswered ? 'Submit Answers' : `Answer all ${questions.length} questions to submit`}
          </Button>
        </div>
      )}
    </div>
  );
}
