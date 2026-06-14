import { useState, useEffect } from 'react';
import {
  Users, Search, CheckCircle2, Clock, ChevronRight, X, Shield,
  TrendingUp, Eye, Award, Star, Sparkles, ArrowLeft, BadgeCheck,
  MapPin, Calendar, Trophy, Zap, Check, AlertCircle, UserCheck
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import sidebarLogo from '../../imports/image0-1.png';

type Screen =
  | 'account-type'
  | 'empty-profile'
  | 'player-info'
  | 'searching'
  | 'match-results'
  | 'claim-profile'
  | 'claim-submitted'
  | 'dashboard-pending'
  | 'dashboard-verified';

interface OnboardingFlowProps {
  onExit: () => void;
}

const mockMatches = [
  {
    id: 1,
    name: 'John Smith',
    nationality: 'Netherlands',
    team: 'Ajax Amsterdam',
    league: 'Eredivisie',
    position: 'ST',
    age: 22,
    confidence: 92,
    photo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    reasons: ['Name matches', 'Date of birth matches', 'Current club matches'],
    recommended: true,
  },
  {
    id: 2,
    name: 'John van Smith',
    nationality: 'Netherlands',
    team: 'Jong Ajax',
    league: 'Eerste Divisie',
    position: 'LW',
    age: 23,
    confidence: 87,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    reasons: ['Name closely matches', 'Nationality matches', 'Position matches'],
    recommended: false,
  },
  {
    id: 3,
    name: 'J. Smith',
    nationality: 'Netherlands',
    team: 'NEC Nijmegen',
    league: 'Eredivisie',
    position: 'RW',
    age: 24,
    confidence: 68,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    reasons: ['Name partially matches', 'Nationality matches'],
    recommended: false,
  },
];

const playerStats = [
  { label: 'Matches', value: '38' },
  { label: 'Goals', value: '32' },
  { label: 'Assists', value: '12' },
  { label: 'Minutes', value: '3,240' },
  { label: 'Yellow Cards', value: '3' },
];

const searchMessages = [
  'Searching football databases...',
  'Comparing player records...',
  'Finding matching statistics...',
  'Looking for your football profile...',
  'Almost there...',
];

export default function OnboardingFlow({ onExit }: OnboardingFlowProps) {
  const [screen, setScreen] = useState<Screen>('account-type');
  const [selectedMatch, setSelectedMatch] = useState<typeof mockMatches[0] | null>(null);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  const goTo = (s: Screen) => setScreen(s);

  return (
    <div className="min-h-screen bg-gray-50">
      {screen === 'account-type' && <AccountTypeScreen onContinuePlayer={() => goTo('empty-profile')} onExit={onExit} />}
      {screen === 'empty-profile' && <EmptyProfileScreen onConnect={() => goTo('player-info')} onSkip={() => goTo('dashboard-pending')} onBack={() => goTo('account-type')} />}
      {screen === 'player-info' && <PlayerInfoScreen onContinue={() => goTo('searching')} onBack={() => goTo('empty-profile')} />}
      {screen === 'searching' && <SearchingScreen onDone={() => goTo('match-results')} />}
      {screen === 'match-results' && (
        <MatchResultsScreen
          matches={mockMatches.filter(m => !dismissedIds.includes(m.id))}
          onSelect={(m) => { setSelectedMatch(m); goTo('claim-profile'); }}
          onDismiss={(id) => setDismissedIds(prev => [...prev, id])}
          onBack={() => goTo('player-info')}
        />
      )}
      {screen === 'claim-profile' && selectedMatch && (
        <ClaimProfileScreen
          match={selectedMatch}
          onClaim={() => goTo('claim-submitted')}
          onChooseAnother={() => goTo('match-results')}
        />
      )}
      {screen === 'claim-submitted' && (
        <ClaimSubmittedScreen
          onViewProfile={() => goTo('dashboard-pending')}
          onContinue={() => goTo('dashboard-pending')}
        />
      )}
      {screen === 'dashboard-pending' && (
        <DashboardPendingScreen
          onVerify={() => goTo('dashboard-verified')}
          onExit={onExit}
        />
      )}
      {screen === 'dashboard-verified' && (
        <DashboardVerifiedScreen onExit={onExit} />
      )}
    </div>
  );
}

// ─── Shared Layout Components ───────────────────────────────────────────────

function OnboardingHeader({ step, totalSteps, onBack }: { step?: number; totalSteps?: number; onBack?: () => void }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition mr-1">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <img src={sidebarLogo} alt="GlobalScout" className="h-8 w-auto" />
        </div>
        {step && totalSteps && (
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i < step ? 'bg-blue-600 w-8' : 'bg-gray-200 w-4'}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">{step}/{totalSteps}</span>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Screen 1: Account Type ──────────────────────────────────────────────────

function AccountTypeScreen({ onContinuePlayer, onExit }: { onContinuePlayer: () => void; onExit: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between">
        <img src={sidebarLogo} alt="GlobalScout" className="h-10 w-auto brightness-0 invert" />
        <button onClick={onExit} className="text-gray-400 hover:text-white text-sm transition flex items-center gap-1">
          <X className="w-4 h-4" /> Exit
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 px-4 py-1.5 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Welcome to GlobalScout
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to Global Scout
          </h1>
          <p className="text-xl text-gray-400">Tell us how you'll use the platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Player Card - Emphasized */}
          <div className="relative group cursor-pointer" onClick={onContinuePlayer}>
            <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 border border-blue-500 hover:border-blue-400 transition-all hover:scale-[1.02] duration-200">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Player</h3>
              <p className="text-blue-100 mb-8 leading-relaxed">
                Showcase your career, statistics, achievements and get discovered by scouts and clubs.
              </p>
              <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold">
                Continue as Player
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Agent Card */}
          <div className="relative group cursor-pointer">
            <div className="relative bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all hover:scale-[1.02] duration-200">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Agent</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Manage players, discover talent and connect with clubs and scouts.
              </p>
              <Button variant="outline" className="w-full border-white/20 text-white bg-white/5 hover:bg-white/10 font-semibold">
                Continue as Agent
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <p className="text-gray-500 text-sm mt-8">You can change this later in your account settings.</p>
      </div>
    </div>
  );
}

// ─── Screen 2: Empty Profile ─────────────────────────────────────────────────

function EmptyProfileScreen({ onConnect, onSkip, onBack }: { onConnect: () => void; onSkip: () => void; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader onBack={onBack} />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        {/* Incomplete notice banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-3 mb-8">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-amber-800 text-sm font-medium">Your profile is incomplete. Connect your football identity to get started.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Empty Profile */}
          <div className="md:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Profile banner</span>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-end gap-4 -mt-14 mb-4">
                  <div className="w-24 h-24 rounded-2xl bg-gray-200 border-4 border-white flex items-center justify-center shadow-sm">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="pb-2">
                    <div className="h-6 w-40 bg-gray-200 rounded-lg mb-2" />
                    <div className="h-4 w-28 bg-gray-100 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {['Matches', 'Goals', 'Assists'].map(stat => (
                    <div key={stat} className="text-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <div className="text-2xl font-bold text-gray-300">—</div>
                      <div className="text-xs text-gray-400 mt-1">{stat}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Empty Sections */}
            <Card className="border-0 shadow-sm opacity-50">
              <CardContent className="p-6">
                <div className="h-5 w-36 bg-gray-200 rounded-lg mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Connect CTA */}
          <div className="space-y-4">
            <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Connect Your Football Identity</h3>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  We'll search professional football databases and connect your statistics to your Global Scout profile.
                </p>
                <div className="space-y-2.5 mb-6">
                  {[
                    { icon: TrendingUp, text: 'Official football statistics' },
                    { icon: BadgeCheck, text: 'Verified player profile' },
                    { icon: Eye, text: 'Increased scout visibility' },
                    { icon: Award, text: 'Professional credibility' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Icon className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full mb-3" onClick={onConnect}>
                  Connect My Football Profile
                </Button>
                <Button variant="ghost" className="w-full text-gray-500 text-sm" onClick={onSkip}>
                  Skip For Now
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Star className="w-6 h-6 text-amber-400 mx-auto mb-2" fill="#fbbf24" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  Profiles with verified football statistics receive <span className="font-semibold text-gray-900">3× more scout views</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 3: Player Information ────────────────────────────────────────────

function PlayerInfoScreen({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const [form, setForm] = useState({
    fullName: '', dob: '', nationality: '', currentClub: '', previousClub: '', position: '',
  });

  const isValid = form.fullName && form.dob && form.nationality && form.currentClub && form.position;

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader step={1} totalSteps={4} onBack={onBack} />

      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Search className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Help us find your football profile</h1>
          <p className="text-gray-500">We'll use this information to search football databases.</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
                <Input
                  placeholder="e.g. John Smith"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Date of Birth</label>
                <Input
                  type="date"
                  value={form.dob}
                  onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Nationality</label>
                <Input
                  placeholder="e.g. Netherlands"
                  value={form.nationality}
                  onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Current Club</label>
                <Input
                  placeholder="e.g. Ajax Amsterdam"
                  value={form.currentClub}
                  onChange={e => setForm(f => ({ ...f, currentClub: e.target.value }))}
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Previous Club
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. FC Groningen"
                  value={form.previousClub}
                  onChange={e => setForm(f => ({ ...f, previousClub: e.target.value }))}
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Position</label>
                <select
                  value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select position</option>
                  <option>Goalkeeper (GK)</option>
                  <option>Defender (CB)</option>
                  <option>Defender (LB / RB)</option>
                  <option>Midfielder (CDM)</option>
                  <option>Midfielder (CM)</option>
                  <option>Midfielder (CAM)</option>
                  <option>Forward (LW / RW)</option>
                  <option>Forward (ST)</option>
                </select>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={onContinue}
              disabled={!isValid}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-5 px-4">
          We only use this information to find your football profile. Your data is never shared with third parties.
        </p>
      </div>
    </div>
  );
}

// ─── Screen 4: Searching ─────────────────────────────────────────────────────

function SearchingScreen({ onDone }: { onDone: () => void }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex(i => (i + 1) % searchMessages.length);
    }, 900);

    const progressTimer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(progressTimer);
          clearInterval(msgTimer);
          setTimeout(onDone, 300);
          return 100;
        }
        return p + 2;
      });
    }, 60);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
    };
  }, [onDone]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex flex-col items-center justify-center px-4">
      {/* Animated orb */}
      <div className="relative mb-12">
        <div className="w-40 h-40 rounded-full bg-blue-600/20 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-blue-600/30 flex items-center justify-center animate-ping absolute" />
          <div className="w-28 h-28 rounded-full bg-blue-600/40 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl">
              <Search className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        {/* Orbiting dots */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-blue-400 opacity-60"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${deg}deg) translateX(72px) translateY(-50%)`,
              animation: `spin 3s linear infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <h2 className="text-2xl font-bold text-white mb-3 text-center">Searching Football Databases</h2>

      {/* Rotating message */}
      <div className="h-7 flex items-center justify-center mb-8">
        <p key={msgIndex} className="text-blue-300 text-lg animate-pulse text-center">
          {searchMessages[msgIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-72 bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-500 text-sm">{progress}%</p>

      {/* DB logos */}
      <div className="flex items-center gap-6 mt-12">
        {['API-Football', 'FIFA Data', 'Transfermarkt'].map((db) => (
          <div key={db} className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-xs text-gray-500">{db}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(var(--start)) translateX(72px) translateY(-50%); }
          to { transform: rotate(calc(var(--start) + 360deg)) translateX(72px) translateY(-50%); }
        }
      `}</style>
    </div>
  );
}

// ─── Screen 5: Match Results ─────────────────────────────────────────────────

function MatchResultsScreen({
  matches, onSelect, onDismiss, onBack,
}: {
  matches: typeof mockMatches;
  onSelect: (m: typeof mockMatches[0]) => void;
  onDismiss: (id: number) => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader step={3} totalSteps={4} onBack={onBack} />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <UserCheck className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Is one of these you?</h1>
          <p className="text-gray-500">We found football profiles that closely match your information.</p>
        </div>

        {matches.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No matches remaining</h3>
              <p className="text-gray-500 mb-6">None of the suggested profiles matched. Let's try again.</p>
              <Button onClick={onBack}>Search Again</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} onSelect={onSelect} onDismiss={onDismiss} />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <button className="text-sm text-gray-500 hover:text-blue-600 underline underline-offset-4 transition">
            I Can't Find My Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match, onSelect, onDismiss,
}: {
  match: typeof mockMatches[0];
  onSelect: (m: typeof mockMatches[0]) => void;
  onDismiss: (id: number) => void;
}) {
  const confidenceColor =
    match.confidence >= 85 ? 'text-green-700 bg-green-100 border-green-200' :
    match.confidence >= 70 ? 'text-amber-700 bg-amber-100 border-amber-200' :
    'text-gray-600 bg-gray-100 border-gray-200';

  return (
    <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${match.recommended ? 'ring-2 ring-blue-500' : ''}`}>
      {match.recommended && (
        <div className="bg-blue-600 px-5 py-2 flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-white" fill="white" />
          <span className="text-white text-xs font-semibold">Recommended Match</span>
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-start gap-5">
          {/* Photo */}
          <div className="relative shrink-0">
            <img src={match.photo} alt={match.name} className="w-20 h-20 rounded-xl object-cover" />
            <Badge className={`absolute -top-2 -right-2 text-xs font-bold px-2 border ${confidenceColor}`}>
              {match.confidence}%
            </Badge>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-gray-900 text-lg">{match.name}</h3>
              <span className="text-xs text-gray-500">Match</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{match.nationality}</span>
              <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />{match.team}</span>
              <span>{match.league}</span>
              <span>{match.position}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{match.age} years</span>
            </div>

            {/* Why we think */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Why we think this is you:</p>
              <div className="space-y-1">
                {match.reasons.map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span className="text-xs text-gray-700">{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button size="sm" onClick={() => onSelect(match)} className="flex-1">
                <CheckCircle2 className="w-4 h-4" />
                This Is Me
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDismiss(match.id)} className="flex-1">
                <X className="w-4 h-4" />
                Not Me
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Screen 6: Claim Profile ─────────────────────────────────────────────────

function ClaimProfileScreen({
  match, onClaim, onChooseAnother,
}: {
  match: typeof mockMatches[0];
  onClaim: () => void;
  onChooseAnother: () => void;
}) {
  const globalScoutData = [
    { label: 'Name', value: 'New User' },
    { label: 'Date of Birth', value: 'March 15, 2004' },
    { label: 'Nationality', value: 'Netherlands' },
    { label: 'Club', value: 'Ajax Amsterdam' },
    { label: 'Position', value: 'Forward (ST)' },
  ];

  const dbData = [
    { label: 'Name', value: match.name },
    { label: 'Date of Birth', value: 'March 15, 2004' },
    { label: 'Nationality', value: match.nationality },
    { label: 'Club', value: match.team },
    { label: 'Position', value: match.position },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader step={4} totalSteps={4} onBack={onChooseAnother} />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Shield className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Claim Football Profile</h1>
          <p className="text-gray-500">Review the details before linking your football identity.</p>
        </div>

        {/* Side-by-side comparison */}
        <Card className="border-0 shadow-sm mb-6 overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="p-6 bg-blue-50 border-r border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-700 text-sm">Global Scout</span>
              </div>
              <div className="space-y-4">
                {globalScoutData.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-700 text-sm">Football Database</span>
              </div>
              <div className="space-y-4">
                {dbData.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Info panel */}
        <Card className="border border-blue-200 bg-blue-50 shadow-sm mb-8">
          <CardContent className="p-5 flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Profile review process</p>
              <p className="text-sm text-blue-700">Your football profile will be reviewed before receiving verified status. This usually takes 24–48 hours.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="flex-1" onClick={onClaim}>
            <CheckCircle2 className="w-4 h-4" />
            Claim Profile
          </Button>
          <Button size="lg" variant="outline" className="flex-1" onClick={onChooseAnother}>
            Choose Another Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 7: Claim Submitted ────────────────────────────────────────────────

function ClaimSubmittedScreen({ onViewProfile, onContinue }: { onViewProfile: () => void; onContinue: () => void }) {
  const steps = [
    { label: 'Account Created', done: true },
    { label: 'Football Profile Selected', done: true },
    { label: 'Claim Submitted', done: true },
    { label: 'Verification Review', done: false, pending: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex flex-col items-center justify-center px-4 py-12">
      {/* Success icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl">
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>
        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20" />
      </div>

      <h1 className="text-4xl font-bold text-white mb-3 text-center">Football Profile Submitted</h1>
      <p className="text-gray-400 text-lg text-center mb-12">Our team will review your claim.</p>

      {/* Timeline */}
      <div className="w-full max-w-sm mb-10">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-green-500' : step.pending ? 'bg-blue-600/30 border-2 border-blue-500' : 'bg-gray-700'}`}>
                {step.done ? (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                ) : step.pending ? (
                  <Clock className="w-4 h-4 text-blue-400" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 h-8 mt-1 ${i < 3 ? 'bg-green-500/40' : 'bg-gray-700'}`} />
              )}
            </div>
            <div className="pt-1 pb-8">
              <p className={`text-sm font-medium ${step.done ? 'text-white' : step.pending ? 'text-blue-300' : 'text-gray-500'}`}>
                {step.done ? '✓ ' : step.pending ? '⏳ ' : ''}{step.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Info card */}
      <Card className="bg-white/5 border border-white/10 w-full max-w-sm mb-8">
        <CardContent className="p-6 space-y-3">
          {[
            'You can already start using Global Scout.',
            'Your football statistics will be visible while verification is pending.',
            'Your profile will display an Unverified badge until approved.',
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-300">{text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button size="lg" className="flex-1 bg-white text-gray-900 hover:bg-gray-100" onClick={onViewProfile}>
          View My Profile
        </Button>
        <Button size="lg" variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// ─── Screen 8: Dashboard Pending ─────────────────────────────────────────────

function DashboardPendingScreen({ onVerify, onExit }: { onVerify: () => void; onExit: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={sidebarLogo} alt="GlobalScout" className="h-8 w-auto" />
          <button onClick={onExit} className="text-sm text-gray-500 hover:text-gray-700 transition">
            Back to Home
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Verification banner */}
        <Card className="border border-amber-200 bg-amber-50 shadow-sm mb-8">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">Verification in Progress</p>
                <p className="text-sm text-amber-700">Our team is reviewing your football identity. Estimated review time: <strong>24–48 hours</strong></p>
              </div>
            </div>
            <Button size="sm" onClick={onVerify} className="bg-amber-600 hover:bg-amber-700 shrink-0">
              View Verification Status
            </Button>
          </CardContent>
        </Card>

        {/* Profile Header */}
        <Card className="border-0 shadow-sm overflow-hidden mb-8">
          <div className="h-36 bg-gradient-to-r from-slate-800 to-blue-900" />
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-6">
              <img
                src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
                alt="Player"
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
              />
              <div className="sm:pb-2">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-2xl font-bold text-gray-900">John Smith</h2>
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Unverified Football Profile
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                  <span>Ajax Amsterdam</span>
                  <span>•</span>
                  <span>Forward</span>
                  <span>•</span>
                  <span>Netherlands</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {playerStats.map(({ label, value }) => (
                <div key={label} className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity placeholder */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold text-gray-900">Recent Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {[
                { opponent: 'FC Barcelona', result: '2-1', goals: 1 },
                { opponent: 'Real Madrid', result: '1-1', goals: 0 },
                { opponent: 'Atletico Madrid', result: '3-0', goals: 2 },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{m.opponent}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold text-gray-900">{m.result}</span>
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">{m.goals}G</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold text-gray-900">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {[
                { label: 'Football Profile Linked', done: true },
                { label: 'Identity Verified', done: false, pending: true },
                { label: 'Statistics Confirmed', done: false },
                { label: 'Scout Visibility Active', done: false },
              ].map(({ label, done, pending }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-green-500' : pending ? 'bg-amber-400' : 'bg-gray-200'}`}>
                    {done ? <Check className="w-3 h-3 text-white" /> : pending ? <Clock className="w-3 h-3 text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                  </div>
                  <span className={`text-sm ${done ? 'text-gray-900 font-medium' : pending ? 'text-amber-700' : 'text-gray-400'}`}>{label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 9: Verified Profile ──────────────────────────────────────────────

function DashboardVerifiedScreen({ onExit }: { onExit: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={sidebarLogo} alt="GlobalScout" className="h-8 w-auto" />
          <button onClick={onExit} className="text-sm text-gray-500 hover:text-gray-700 transition">
            Back to Home
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Verified Banner */}
        <Card className="border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm mb-8 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <BadgeCheck className="w-6 h-6 text-white" fill="white" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 text-lg">Verified Football Profile</h3>
                <p className="text-green-700 text-sm">Your identity has been confirmed by the GlobalScout team.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: UserCheck, label: 'Verified Identity', color: 'text-green-700 bg-green-100' },
                { icon: TrendingUp, label: 'Verified Statistics', color: 'text-green-700 bg-green-100' },
                { icon: Eye, label: 'Visible to Scouts', color: 'text-green-700 bg-green-100' },
                { icon: Shield, label: 'Trusted Profile', color: 'text-green-700 bg-green-100' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${color}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profile Header */}
        <Card className="border-0 shadow-sm overflow-hidden mb-8">
          <div className="h-36 bg-gradient-to-r from-green-700 via-slate-800 to-blue-900 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-end px-8 opacity-20">
              <BadgeCheck className="w-32 h-32 text-white" />
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-6">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
                  alt="Player"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              </div>
              <div className="sm:pb-2">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-2xl font-bold text-gray-900">John Smith</h2>
                  <Badge className="bg-green-500 text-white border-0 text-xs gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                  <span>Ajax Amsterdam</span>
                  <span>•</span>
                  <span>Forward</span>
                  <span>•</span>
                  <span>Netherlands</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {playerStats.map(({ label, value }) => (
                <div key={label} className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trust indicators + performance */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold text-gray-900">Verified Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {[
                { label: 'Shots on Target', value: '156', pct: 68 },
                { label: 'Pass Accuracy', value: '87%', pct: 87 },
                { label: 'Dribbles Completed', value: '124', pct: 72 },
                { label: 'Aerial Duels Won', value: '78', pct: 61 },
              ].map(({ label, value, pct }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm text-gray-700">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">{value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold text-gray-900">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {[
                'Football Profile Linked',
                'Identity Verified',
                'Statistics Confirmed',
                'Scout Visibility Active',
              ].map((label) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-900 font-medium">{label}</span>
                </div>
              ))}

              <Separator />

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Eye className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Profile is live</p>
                  <p className="text-xs text-green-700">Visible to 2,500+ scouts worldwide</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
