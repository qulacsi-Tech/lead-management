import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea, Label } from '../../components/ui/Field';

const initialPapers = [
  { id: 1, title: 'Final Mock: Advanced Quantum Mechanics', meta: 'Physics · Grade 12 Advanced · Posted 2 days ago', downloads: '1,245', likes: '842', saves: '156', views: '5,820', icon: 'description' },
  { id: 2, title: 'Algebra Foundations: Unit 4 Diagnostic', meta: 'Mathematics · Grade 10 · Posted 1 week ago', downloads: '3,120', likes: '2,104', saves: '412', views: '12,400', icon: 'quiz' },
  { id: 3, title: 'Intro to Python: Mid-Term Practice', meta: 'Computer Science · Undergraduate · Posted 3 weeks ago', downloads: '850', likes: '540', saves: '89', views: '2,150', icon: 'terminal' },
];

export default function MentorPracticeTests() {
  const [f, setF] = useState({ title: '', subject: 'Mathematics', targetClass: '', description: '' });
  const [papers, setPapers] = useState(initialPapers);
  const setField = (key, value) => setF((prev) => ({ ...prev, [key]: value }));

  const handlePublish = (e) => {
    e.preventDefault();
    if (!f.title) return;
    setPapers((prev) => [
      {
        id: Date.now(),
        title: f.title,
        meta: `${f.subject} · ${f.targetClass || 'General'} · Posted just now`,
        downloads: '0', likes: '0', saves: '0', views: '0', icon: 'description',
      },
      ...prev,
    ]);
    setF({ title: '', subject: 'Mathematics', targetClass: '', description: '' });
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <section className="flex justify-between items-center gap-6 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary m-0 mb-1">Practice Tests Management</h2>
          <p className="text-on-surface-variant m-0">Design, upload, and track performance of your educational materials.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-secondary-container px-4 py-2.5 rounded-xl">
            <span className="material-symbols-outlined text-on-secondary-container">workspace_premium</span>
            <span className="text-xs font-semibold text-on-secondary-container">Quality Educator 2024</span>
          </div>
          <div className="flex items-center gap-2 bg-primary-fixed px-4 py-2.5 rounded-xl">
            <span className="material-symbols-outlined text-primary">verified</span>
            <span className="text-xs font-semibold text-primary">Top Contributor</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <Card className="lg:col-span-8 p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary">cloud_upload</span>
            <h3 className="text-lg font-semibold m-0">Upload New Paper</h3>
          </div>
          <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label>Paper Title</Label>
              <Input value={f.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g., Advanced Calculus Mock 2024" />
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={f.subject} onChange={(e) => setField('subject', e.target.value)}>
                <option>Mathematics</option><option>Physics</option><option>Computer Science</option><option>Business Analytics</option>
              </Select>
            </div>
            <div>
              <Label>Target Class</Label>
              <Input value={f.targetClass} onChange={(e) => setField('targetClass', e.target.value)} placeholder="e.g., Grade 12 / Undergraduate" />
            </div>
            <div>
              <Label>Answer Key (Optional)</Label>
              <div className="flex items-center justify-between border border-dashed border-outline-variant rounded-lg px-3.5 py-2.5 cursor-pointer text-on-surface-variant text-sm">
                <span>Select Key PDF</span><span className="material-symbols-outlined text-lg">attach_file</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Short Description</Label>
              <Textarea rows={2} value={f.description} onChange={(e) => setField('description', e.target.value)} placeholder="Briefly describe the topics covered..." />
            </div>
            <div className="md:col-span-2">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-8 cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-primary mb-2">picture_as_pdf</span>
                <p className="text-primary text-sm font-semibold m-0">Drop your Test Paper PDF here</p>
                <p className="text-xs text-on-surface-variant m-0 mt-1">Maximum size 15MB</p>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" pill>Publish Test Paper</Button>
            </div>
          </form>
        </Card>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 bg-primary text-white border-none">
            <h4 className="text-lg font-semibold mb-4">Content Impact</h4>
            <div className="flex flex-col gap-3">
              {[
                ['download', 'Total Downloads', '12.4k'],
                ['favorite', 'Community Likes', '8.9k'],
                ['visibility', 'Profile Views', '45k'],
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

          <Card className="p-6">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-5">Milestone Progress</h4>
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold">Elite Creator Badge</span><span className="text-primary">85%</span>
              </div>
              <div className="h-2 bg-primary-fixed rounded-full overflow-hidden"><div className="h-full w-[85%] bg-primary" /></div>
            </div>
            <div className="flex items-center gap-3 bg-secondary-container/20 border border-secondary/15 p-3 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined">star</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-secondary-container m-0">100+ Tests Published</p>
                <p className="text-[11px] text-on-surface-variant m-0">Unlocked on Sep 12, 2023</p>
              </div>
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
        <div className="flex flex-col gap-3">
          {papers.map((p) => (
            <Card key={p.id} className="p-4 flex items-center gap-5 hover:border-primary">
              <div className="w-14 h-14 rounded-xl bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">{p.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-sm font-semibold m-0 mb-0.5">{p.title}</h4>
                    <p className="text-xs text-on-surface-variant m-0">{p.meta}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button className="p-2 bg-transparent border-none text-primary rounded-lg cursor-pointer hover:bg-surface-container-low">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button className="p-2 bg-transparent border-none text-error rounded-lg cursor-pointer hover:bg-error-container">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  {[
                    ['download', 'Downloads', p.downloads],
                    ['favorite', 'Likes', p.likes],
                    ['bookmark', 'Saves', p.saves],
                    ['visibility', 'Views', p.views],
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
        <div className="flex justify-center mt-5">
          <Button variant="outline" pill>Load More Resources</Button>
        </div>
      </section>
    </div>
  );
}
