import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PAPERS } from '../../data/papers';

export default function TakeTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const paper = PAPERS.find((p) => String(p.id) === id);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!paper) {
    return (
      <div className="max-w-3xl w-full mx-auto px-10 py-16 box-border text-center">
        <p className="text-on-surface-variant mb-4">That practice test couldn't be found.</p>
        <Link to="/student/practice-tests"><Button>Back to Practice Tests</Button></Link>
      </div>
    );
  }

  const selectAnswer = (qIndex, optIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const score = paper.questions.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0);
  const allAnswered = paper.questions.every((_, i) => answers[i] !== undefined);

  return (
    <div className="max-w-3xl w-full mx-auto px-10 py-8 box-border">
      <div className="mb-6">
        <span className="text-primary font-bold tracking-wider text-xs uppercase mb-2 block">{paper.subject}</span>
        <h2 className="font-display text-2xl font-bold text-primary m-0">{paper.title}</h2>
        <p className="text-on-surface-variant m-0 mt-1">By {paper.mentor}</p>
      </div>

      {submitted ? (
        <Card className="p-8 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-secondary">military_tech</span>
          <h3 className="font-display text-2xl font-bold m-0">
            You scored {score} / {paper.questions.length}
          </h3>
          <p className="text-on-surface-variant m-0">
            {score === paper.questions.length ? 'Perfect score — well done!' : 'Review the paper again to sharpen your weak spots.'}
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => { setAnswers({}); setSubmitted(false); }}>Retake</Button>
            <Button onClick={() => navigate('/student/practice-tests')}>Back to Practice Tests</Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {paper.questions.map((q, qi) => (
            <Card key={qi} className="p-6">
              <p className="font-semibold text-sm m-0 mb-4">{qi + 1}. {q.q}</p>
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
          <Button disabled={!allAnswered} onClick={() => setSubmitted(true)} size="lg">
            {allAnswered ? 'Submit Answers' : `Answer all ${paper.questions.length} questions to submit`}
          </Button>
        </div>
      )}
    </div>
  );
}
