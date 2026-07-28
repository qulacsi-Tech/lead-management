import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea, Label } from '../../components/ui/Field';
import { fetchMyPapers, createPaper, updatePaper, deletePaper, ApiError } from '../../Api/Api';

const emptyQuestion = () => ({ question_text: '', options: ['', '', '', ''], correct_answer: 0 });
const emptyForm = () => ({ title: '', subject: 'Mathematics', targetClass: '', description: '', questions: [emptyQuestion()] });

export default function MentorPracticeTests() {
  const [f, setF] = useState(emptyForm());
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const setField = (key, value) => setF((prev) => ({ ...prev, [key]: value }));

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchMyPapers();
      setPapers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load papers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addQuestion = () => setF((prev) => ({ ...prev, questions: [...prev.questions, emptyQuestion()] }));
  const removeQuestion = (idx) => setF((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  const updateQuestion = (idx, key, value) =>
    setF((prev) => ({ ...prev, questions: prev.questions.map((q, i) => (i === idx ? { ...q, [key]: value } : q)) }));
  const updateOption = (idx, optIdx, value) =>
    setF((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === idx ? { ...q, options: q.options.map((o, oi) => (oi === optIdx ? value : o)) } : q
      ),
    }));

  const startEdit = (p) => {
    setEditingId(p.id);
    setF({ title: p.title, subject: p.subject, targetClass: p.target_class || '', description: p.description || '', questions: [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setF(emptyForm());
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!f.title) return;
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await updatePaper(editingId, {
          title: f.title,
          subject: f.subject,
          target_class: f.targetClass || null,
          description: f.description || null,
        });
      } else {
        const questions = f.questions
          .filter((q) => q.question_text.trim() && q.options.every((o) => o.trim()))
          .map((q) => ({ question_text: q.question_text, options: q.options, correct_answer: q.correct_answer }));
        await createPaper({
          title: f.title,
          subject: f.subject,
          target_class: f.targetClass || null,
          description: f.description || null,
          questions,
        });
      }
      setEditingId(null);
      setF(emptyForm());
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save paper.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePaper(id);
      setPapers((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete paper.');
    }
  };

  const totals = papers.reduce(
    (acc, p) => ({ downloads: acc.downloads + (p.downloads || 0), likes: acc.likes + (p.likes || 0) }),
    { downloads: 0, likes: 0 }
  );

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <section className="flex justify-between items-center gap-6 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary m-0 mb-1">Practice Tests Management</h2>
          <p className="text-on-surface-variant m-0">Create board-exam sample papers for students to practice with.</p>
        </div>
      </section>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <Card className="lg:col-span-8 p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary">cloud_upload</span>
            <h3 className="text-lg font-semibold m-0">{editingId ? 'Edit Paper Details' : 'Create New Sample Paper'}</h3>
          </div>
          <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label>Paper Title</Label>
              <Input value={f.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g., Advanced Calculus Mock 2024" required />
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={f.subject} onChange={(e) => setField('subject', e.target.value)}>
                <option>Mathematics</option><option>Physics</option><option>Chemistry</option>
                <option>Biology</option><option>English</option><option>Computer Science</option><option>Business Analytics</option>
              </Select>
            </div>
            <div>
              <Label>Target Class</Label>
              <Input value={f.targetClass} onChange={(e) => setField('targetClass', e.target.value)} placeholder="e.g., Grade 12 / Undergraduate" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={f.status || 'published'} onChange={(e) => setField('status', e.target.value)}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Short Description</Label>
              <Textarea rows={2} value={f.description} onChange={(e) => setField('description', e.target.value)} placeholder="Briefly describe the topics covered..." />
            </div>

            {!editingId && (
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <Label>Questions (MCQ)</Label>
                  <Button type="button" variant="outline" onClick={addQuestion}>Add Question</Button>
                </div>
                <div className="flex flex-col gap-4">
                  {f.questions.map((q, idx) => (
                    <div key={idx} className="border border-outline-variant rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <Input
                          value={q.question_text}
                          onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                          placeholder={`Question ${idx + 1}`}
                          className="flex-1"
                        />
                        {f.questions.length > 1 && (
                          <button type="button" onClick={() => removeQuestion(idx)} className="p-2 bg-transparent border-none text-error rounded-lg cursor-pointer">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <label key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${idx}`}
                              checked={q.correct_answer === optIdx}
                              onChange={() => updateQuestion(idx, 'correct_answer', optIdx)}
                            />
                            <Input
                              value={opt}
                              onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`}
                              className="flex-1"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-3">
              {editingId && <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>}
              <Button type="submit" pill disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Test Paper'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 bg-primary text-white border-none">
            <h4 className="text-lg font-semibold mb-4">Content Impact</h4>
            <div className="flex flex-col gap-3">
              {[
                ['download', 'Total Attempts', totals.downloads.toLocaleString()],
                ['favorite', 'Community Likes', totals.likes.toLocaleString()],
                ['description', 'Papers Published', papers.length],
              ].map(([icon, label, val]) => (
                <div key={label} className="flex justify-between items-center bg-white/10 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined">{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-base font-bold">{val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold m-0">Published Papers</h3>
            <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold">
              {papers.length} Total
            </span>
          </div>
        </div>
        {loading ? (
          <p className="text-on-surface-variant text-sm">Loading...</p>
        ) : papers.length === 0 ? (
          <p className="text-on-surface-variant text-sm">No papers published yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {papers.map((p) => (
              <Card key={p.id} className="p-4 flex items-center gap-5 hover:border-primary">
                <div className="w-14 h-14 rounded-xl bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">description</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-sm font-semibold m-0 mb-0.5">{p.title}</h4>
                      <p className="text-xs text-on-surface-variant m-0">
                        {p.subject} · {p.target_class || 'General'} · {p.status} · {p.question_count} question{p.question_count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(p)} className="p-2 bg-transparent border-none text-primary rounded-lg cursor-pointer hover:bg-surface-container-low">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 bg-transparent border-none text-error rounded-lg cursor-pointer hover:bg-error-container">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                    {[
                      ['download', 'Attempts', p.downloads],
                      ['favorite', 'Likes', p.likes],
                      ['quiz', 'Questions', p.question_count],
                    ].map(([icon, label, val]) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-outline">{icon}</span>
                        <div>
                          <p className="text-[11px] text-outline m-0">{label}</p>
                          <p className="text-sm font-bold m-0">{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
