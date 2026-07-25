import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';

const MOCK_LEADERS = [
  { name: 'Arjun Mehta', xp: '12,450 XP', points: 520 },
  { name: 'Sara Khan', xp: '11,200 XP', points: 480 },
  { name: 'Vivek Raj', xp: '10,890 XP', points: 410 },
  { name: 'Divya Menon', xp: '9,760 XP', points: 360 },
  { name: 'Karan Shah', xp: '8,540 XP', points: 305 },
  { name: 'Neha Joshi', xp: '7,910 XP', points: 260 },
  { name: 'Farhan Ali', xp: '6,430 XP', points: 210 },
];

const RANK_TONE = ['bg-secondary', 'bg-outline', 'bg-primary-container'];

export default function Leaderboard() {
  const { displayName } = useAuth();
  const { leadsFor } = useData();

  const myVerified = leadsFor(displayName).filter((l) => l.status === 'verified').length;
  const myPoints = leadsFor(displayName).reduce((sum, l) => sum + l.points, 0);

  const board = [...MOCK_LEADERS, { name: displayName || 'You', xp: `${myPoints * 24} XP`, points: myPoints, isMe: true }]
    .sort((a, b) => b.points - a.points);

  return (
    <div className="max-w-3xl w-full mx-auto px-10 py-8 box-border">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-primary m-0">Full Leaderboard</h2>
        <p className="text-on-surface-variant m-0 mt-1">
          Ranked by reward points earned from verified referrals. You've referred {leadsFor(displayName).length} student(s), {myVerified} verified.
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col divide-y divide-outline-variant">
          {board.map((l, i) => (
            <div
              key={l.name}
              className={`flex items-center gap-4 p-4 ${l.isMe ? 'bg-primary-fixed' : ''}`}
            >
              <div className="relative w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {l.name.slice(0, 2).toUpperCase()}
                {i < 3 && (
                  <div className={`absolute -top-1 -left-1 w-[20px] h-[20px] ${RANK_TONE[i]} text-white rounded-full flex items-center justify-center text-[9px] font-bold`}>
                    {i + 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm m-0">{l.name}{l.isMe ? ' (You)' : ''}</p>
                <p className="text-[11px] text-on-surface-variant m-0">{l.xp}</p>
              </div>
              <span className="text-sm font-bold text-secondary">#{i + 1} · {l.points} pts</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
