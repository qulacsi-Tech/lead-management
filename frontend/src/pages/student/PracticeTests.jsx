import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { PAPERS } from '../../data/papers';

function Stars({ rating, size = 'text-base' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`material-symbols-outlined ${size} ${n <= Math.round(rating) ? 'text-amber-500' : 'text-outline-variant'}`}
          style={n <= Math.round(rating) ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function PracticeTests() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [ratedIds, setRatedIds] = useState([]);
  const [activePaperId, setActivePaperId] = useState(null);
  const [tempRating, setTempRating] = useState(0);

  const visiblePapers = filter === 'saved' ? PAPERS.filter((p) => ratedIds.includes(p.id)) : PAPERS;
  const activePaper = PAPERS.find((p) => p.id === activePaperId);

  const submitRating = () => {
    setRatedIds((prev) => (prev.includes(activePaperId) ? prev : [...prev, activePaperId]));
    setActivePaperId(null);
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <div className="flex justify-between items-end gap-6 flex-wrap mb-8">
        <div>
          <span className="text-primary font-bold tracking-wider text-xs uppercase mb-2 block">
            Practice Library
          </span>
          <h2 className="font-display text-3xl font-bold text-primary m-0">Guess Papers from Top Mentors</h2>
          <p className="text-on-surface-variant m-0 mt-2">Curated mock papers rated by students who've taken them.</p>
        </div>
        <div className="flex bg-primary-fixed rounded-xl p-1 gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none ${
              filter === 'all' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'bg-transparent text-on-surface-variant'
            }`}
          >
            All Subjects
          </button>
          <button
            onClick={() => setFilter('saved')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none ${
              filter === 'saved' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'bg-transparent text-on-surface-variant'
            }`}
          >
            Saved
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {visiblePapers.map((p) => (
          <Card key={p.id} className="overflow-hidden flex flex-col">
            <div className={`h-24 bg-gradient-to-br ${p.band} relative flex items-center px-4`}>
              <span className="material-symbols-outlined text-white text-3xl opacity-90">description</span>
              <span className="absolute top-3 right-3 bg-white/90 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">
                {p.subject}
              </span>
            </div>
            <div className="p-5 flex flex-col gap-3 flex-1">
              <div>
                <h4 className="text-sm font-semibold m-0 mb-1">{p.title}</h4>
                <p className="text-xs text-on-surface-variant m-0">By {p.mentor} · {p.downloads} downloads</p>
              </div>
              <div className="flex items-center gap-2">
                <Stars rating={p.rating} />
                <span className="text-sm font-semibold">{p.rating.toFixed(1)}</span>
                <span className="text-xs text-outline">({p.reviews})</span>
              </div>
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  onClick={() => { setActivePaperId(p.id); setTempRating(0); }}
                  className="flex-1 py-2.5 bg-surface-container-low text-primary rounded-lg font-semibold text-xs cursor-pointer border-none flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">
                    {ratedIds.includes(p.id) ? 'check_circle' : 'star_rate'}
                  </span>
                  {ratedIds.includes(p.id) ? 'Rated' : 'Rate Paper'}
                </button>
                <button
                  onClick={() => navigate(`/student/practice-tests/${p.id}`)}
                  className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold text-xs cursor-pointer border-none flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">play_arrow</span>Start Test
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!activePaper} onClose={() => setActivePaperId(null)}>
        <h4 className="text-lg font-semibold m-0 mb-1">Rate this paper</h4>
        <p className="text-sm text-on-surface-variant m-0 mb-5">{activePaper?.title}</p>
        <div className="flex gap-2 justify-center mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setTempRating(n)}
              className="bg-transparent border-none cursor-pointer p-0"
            >
              <span
                className={`material-symbols-outlined text-3xl ${n <= tempRating ? 'text-amber-500' : 'text-outline-variant'}`}
                style={n <= tempRating ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                star
              </span>
            </button>
          ))}
        </div>
        <Button className="w-full" onClick={submitRating}>Submit Rating</Button>
      </Modal>
    </div>
  );
}
