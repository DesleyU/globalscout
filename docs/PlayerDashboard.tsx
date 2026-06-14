import { useState } from 'react';
import {
  Home, User, BarChart3, Video, MessageCircle, Settings,
  Bell, Search, ChevronRight, TrendingUp, Calendar, Eye, Star,
  Activity, Users, Play, Mail, Send, Trash2, Archive, BadgeCheck
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import logoImage from '../../imports/image0.png';
import sidebarLogo from '../../imports/image0-1.png';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PlayerCard from './PlayerCard';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';

type MenuItem = 'dashboard' | 'profile' | 'statistics' | 'videos' | 'messages' | 'network' | 'settings';

const performanceData = [
  { subject: 'Speed', value: 99 },
  { subject: 'Shooting', value: 78 },
  { subject: 'Passing', value: 87 },
  { subject: 'Dribbling', value: 82 },
  { subject: 'Defense', value: 65 },
  { subject: 'Physical', value: 75 },
];

const profileViewsData = [
  { name: 'Mon', views: 45 },
  { name: 'Tue', views: 52 },
  { name: 'Wed', views: 48 },
  { name: 'Thu', views: 65 },
  { name: 'Fri', views: 58 },
  { name: 'Sat', views: 72 },
  { name: 'Sun', views: 68 },
];

const matchHistory = [
  { opponent: 'FC Barcelona', date: 'May 15, 2026', result: '2-1', goals: 1, assists: 0 },
  { opponent: 'Real Madrid', date: 'May 10, 2026', result: '1-1', goals: 0, assists: 1 },
  { opponent: 'Atletico Madrid', date: 'May 5, 2026', result: '3-0', goals: 2, assists: 1 },
];

const upcomingMatches = [
  { opponent: 'Valencia CF', date: 'May 22, 2026', time: '20:00' },
  { opponent: 'Sevilla FC', date: 'May 28, 2026', time: '18:30' },
];

const recentActivity = [
  { action: 'Profile viewed by Liverpool FC scout', time: '2 hours ago' },
  { action: 'New message from Bayern Munich', time: '5 hours ago' },
  { action: 'Match highlights uploaded', time: '1 day ago' },
  { action: 'Performance stats updated', time: '2 days ago' },
];

export default function PlayerDashboard() {
  const [activeMenu, setActiveMenu] = useState<MenuItem>('dashboard');
  const [isPremium, setIsPremium] = useState(false);
  const [messagesSent, setMessagesSent] = useState(0);

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardContent isPremium={isPremium} />;
      case 'profile':
        return <ProfileContent />;
      case 'statistics':
        return <StatisticsContent />;
      case 'videos':
        return <VideosContent />;
      case 'messages':
        return <MessagesContent isPremium={isPremium} messagesSent={messagesSent} setMessagesSent={setMessagesSent} />;
      case 'network':
        return <NetworkContent />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <DashboardContent isPremium={isPremium} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-48 bg-gradient-to-b from-slate-900 to-slate-800 text-white fixed h-full overflow-y-auto flex flex-col">
        <div className="p-4 flex-1">
          <img src={sidebarLogo} alt="GlobalScout" className="h-24 w-auto mb-6 mx-auto brightness-0 invert" />

          <nav className="space-y-1">
            <NavItem icon={<Home className="w-4 h-4" />} text="Dashboard" active={activeMenu === 'dashboard'} onClick={() => setActiveMenu('dashboard')} />
            <NavItem icon={<User className="w-4 h-4" />} text="My Profile" active={activeMenu === 'profile'} onClick={() => setActiveMenu('profile')} />
            <NavItem icon={<BarChart3 className="w-4 h-4" />} text="Statistics" active={activeMenu === 'statistics'} onClick={() => setActiveMenu('statistics')} />
            <NavItem icon={<Video className="w-4 h-4" />} text="Videos" active={activeMenu === 'videos'} onClick={() => setActiveMenu('videos')} />
            <NavItem icon={<MessageCircle className="w-4 h-4" />} text="Messages" badge="3" active={activeMenu === 'messages'} onClick={() => setActiveMenu('messages')} />
            <NavItem icon={<Users className="w-4 h-4" />} text="My Network" active={activeMenu === 'network'} onClick={() => setActiveMenu('network')} />
          </nav>
        </div>

        <div className="px-4 py-3 border-t border-slate-700">
          <NavItem icon={<Settings className="w-4 h-4" />} text="Settings" active={activeMenu === 'settings'} onClick={() => setActiveMenu('settings')} />
        </div>

        <div className="p-3 mx-3 mb-4 bg-blue-600/20 rounded-lg border border-blue-500/30">
          <h4 className="font-semibold mb-1 text-xs">{isPremium ? 'Premium Active' : 'Upgrade to Pro'}</h4>
          <p className="text-xs text-gray-300 mb-2">{isPremium ? 'All features unlocked' : 'Get unlimited visibility'}</p>
          <Button
            size="sm"
            onClick={() => setIsPremium(!isPremium)}
            className="w-full text-xs h-7">
            {isPremium ? 'Manage Plan' : 'Upgrade Now'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-48">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 max-w-xl bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search matches, stats, scouts..."
                className="flex-1 outline-none text-gray-700 bg-transparent text-sm"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  4
                </span>
              </button>
              <div className="flex items-center space-x-3">
                <img
                  src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100"
                  alt="Player"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    Desley Ubbink
                    {isPremium && <BadgeCheck className="w-4 h-4 text-blue-600 fill-blue-600" />}
                  </div>
                  <div className="text-xs text-gray-500">Forward</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {renderContent()}
      </div>
    </div>
  );
}

function DashboardContent({ isPremium }: { isPremium: boolean }) {
  return (
    <div className="p-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <img
            src="https://images.unsplash.com/photo-1508087625439-de3978963553?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
            alt="Background"
            className="h-64 w-auto object-cover"
          />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <PlayerCard
              name="Desley Ubbink"
              position="ST"
              image="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              club="Ajax Amsterdam"
              nationality="Netherlands"
            />
            <div>
              <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
                Desley Ubbink
                {isPremium && <BadgeCheck className="w-7 h-7 text-blue-400 fill-blue-400" />}
              </h1>
              <div className="flex items-center space-x-4 text-gray-300 text-sm">
                <span>Forward • #10</span>
                <span>•</span>
                <span>Ajax Amsterdam</span>
                <span>•</span>
                <span>22 years old</span>
              </div>
              <div className="flex items-center space-x-3 mt-3">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Edit Profile</Button>
                <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">Share Profile</Button>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Profile Views (7 days)</div>
            <div className="text-4xl font-bold text-blue-400">1,248</div>
            <div className="text-sm text-green-400 flex items-center justify-end mt-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12.5%
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        <StatCard label="Goals" value="32" color="blue" />
        <StatCard label="Assists" value="12" color="green" />
        <StatCard label="Matches" value="38" color="purple" />
        <StatCard label="Pass Accuracy" value="87%" color="orange" />
        <StatCard label="Yellow Cards" value="3" color="yellow" />
        <StatCard label="Red Cards" value="0" color="red" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-6 items-start">
        {/* Left Column */}
        <div className="col-span-2 flex flex-col gap-6">
          {/* Highlight Videos */}
          <Card className="shadow-sm border-0" style={{ height: '260px' }}>
            <CardContent className="p-3 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-bold text-gray-900">Latest Highlights</CardTitle>
                <div className="flex items-center space-x-1">
                  <Video className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-gray-500">2 days ago</span>
                </div>
              </div>

              <div className="relative bg-gray-900 rounded-lg overflow-hidden group cursor-pointer mb-2" style={{ height: '130px' }}>
                <img
                  src="https://images.unsplash.com/photo-1553778263-73a83bab9b0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
                  alt="Highlight Video"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition flex items-center justify-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition shadow-xl">
                    <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-bold text-xs">Season Highlights</p>
                  <p className="text-gray-300 text-xs">8:42 min</p>
                </div>
                <Badge className="absolute top-2 right-2 bg-red-600 text-white border-0 text-[10px] gap-1">
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                  TRENDING
                </Badge>
              </div>

              {isPremium ? (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    { src: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600', label: 'Skills' },
                    { src: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600', label: 'Goals' },
                  ].map(({ src, label }) => (
                    <div key={label} className="relative bg-gray-900 rounded-lg overflow-hidden group cursor-pointer" style={{ height: '70px' }}>
                      <img src={src} alt={label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                          <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-xs font-semibold">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['Skills', 'Goals'].map((label) => (
                    <div key={label} className="flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg" style={{ height: '70px' }}>
                      <Video className="w-5 h-5 text-blue-600 mb-1" />
                      <p className="text-xs text-gray-600 font-semibold">Premium</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-xs mt-auto">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-600">24.5K</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500" fill="#eab308" />
                    <span className="text-gray-600">1.8K</span>
                  </div>
                </div>
                <Button variant="link" size="sm" className="text-blue-600 text-xs h-auto p-0">View All →</Button>
              </div>
            </CardContent>
          </Card>

          {/* Performance Radar */}
          <Card className="shadow-sm border-0" style={{ height: '260px' }}>
            <CardContent className="p-3 h-full">
              <CardTitle className="text-sm font-bold text-gray-900 mb-4">Performance Overview</CardTitle>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={performanceData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Radar name="Performance" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Match History */}
          <Card className="shadow-sm border-0" style={{ height: '260px' }}>
            <CardContent className="p-3 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-sm font-bold text-gray-900">Match History</CardTitle>
                <Button variant="link" size="sm" className="text-blue-600 text-xs h-auto p-0">View All</Button>
              </div>
              <div className="space-y-2">
                {matchHistory.map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">{match.opponent}</div>
                      <div className="text-xs text-gray-500">{match.date}</div>
                    </div>
                    <div className="text-center px-3">
                      <div className="font-bold text-sm text-gray-900">{match.result}</div>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="text-center">
                        <div className="text-gray-500">Goals</div>
                        <div className="font-bold text-blue-600">{match.goals}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500">Assists</div>
                        <div className="font-bold text-green-600">{match.assists}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Profile Views */}
          <Card className="shadow-sm border-0 flex flex-col" style={{ height: '260px' }}>
            <CardContent className="p-3 h-full flex flex-col">
              <CardTitle className="text-sm font-bold text-gray-900 mb-2">Profile Views</CardTitle>
              {isPremium ? (
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profileViewsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center px-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Eye className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="font-bold text-gray-900 text-sm mb-1">Premium Feature</p>
                    <p className="text-xs text-gray-500 mb-3">Unlock detailed analytics</p>
                    <Button size="sm" className="text-xs h-7">Upgrade to Pro</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm border-0" style={{ height: '260px' }}>
            <CardContent className="p-3 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-bold text-gray-900">Recent Activity</CardTitle>
                <Activity className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-900">{activity.action}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Matches */}
          <Card className="shadow-sm border-0" style={{ height: '260px' }}>
            <CardContent className="p-3 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-bold text-gray-900">Upcoming Matches</CardTitle>
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-2">
                {upcomingMatches.map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                    <div>
                      <div className="font-semibold text-xs text-gray-900">{match.opponent}</div>
                      <div className="text-xs text-gray-500">{match.date} • {match.time}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileContent() {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="shadow-sm border-0">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', type: 'text', value: 'Desley Ubbink' },
                  { label: 'Date of Birth', type: 'date', value: '2004-03-15' },
                  { label: 'Nationality', type: 'text', value: 'Netherlands' },
                  { label: 'Position', type: 'text', value: 'Forward' },
                  { label: 'Height (cm)', type: 'number', value: '182' },
                  { label: 'Weight (kg)', type: 'number', value: '75' },
                ].map(({ label, type, value }) => (
                  <div key={label}>
                    <label className="text-sm text-gray-600 block mb-1">{label}</label>
                    <Input type={type} defaultValue={value} />
                  </div>
                ))}
              </div>
              <Button className="mt-6">Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Current Club</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Club Name', type: 'text', value: 'Ajax Amsterdam' },
                  { label: 'Jersey Number', type: 'number', value: '10' },
                  { label: 'Contract Until', type: 'date', value: '2028-06-30' },
                ].map(({ label, type, value }) => (
                  <div key={label}>
                    <label className="text-sm text-gray-600 block mb-1">{label}</label>
                    <Input type={type} defaultValue={value} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-sm border-0">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <img
                src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                alt="Profile"
                className="w-full rounded-lg mb-4"
              />
              <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                Change Photo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatisticsContent() {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Season Statistics 2025/26</h2>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard label="Goals" value="32" color="blue" />
        <StatCard label="Assists" value="12" color="green" />
        <StatCard label="Matches Played" value="38" color="purple" />
        <StatCard label="Minutes Played" value="3,240" color="orange" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="shadow-sm border-0">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold text-gray-900">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Radar name="Performance" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold text-gray-900">Detailed Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatRow label="Shots on Target" value="156" percentage={68} />
              <StatRow label="Pass Accuracy" value="87%" percentage={87} />
              <StatRow label="Dribbles Completed" value="124" percentage={72} />
              <StatRow label="Tackles Won" value="45" percentage={65} />
              <StatRow label="Aerial Duels Won" value="78" percentage={61} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function VideosContent() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">My Videos</h2>
        <Button>
          <Video className="w-4 h-4" />
          Upload New Video
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden shadow-sm hover:shadow-lg transition border-0">
            <div className="relative aspect-video bg-gray-900 cursor-pointer group">
              <img
                src="https://images.unsplash.com/photo-1553778263-73a83bab9b0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                alt="Video"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="font-semibold text-gray-900 mb-1">Match Highlights #{i}</p>
              <p className="text-sm text-gray-500">12.5K views • 3 days ago</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MessagesContent({ isPremium, messagesSent, setMessagesSent }: { isPremium: boolean; messagesSent: number; setMessagesSent: (count: number) => void }) {
  const [messageInput, setMessageInput] = useState('');
  const canSendMessage = isPremium || messagesSent < 3;
  const messagesRemaining = isPremium ? Infinity : Math.max(0, 3 - messagesSent);

  const handleSendMessage = () => {
    if (!canSendMessage || !messageInput.trim()) return;
    setMessagesSent(messagesSent + 1);
    setMessageInput('');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Messages</h2>
        {!isPremium && (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5">
            {messagesRemaining > 0 ? `${messagesRemaining} free messages remaining` : 'Upgrade to continue messaging'}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="font-bold text-gray-900">Conversations</CardTitle>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Liverpool FC Scout', msg: 'Interested in your profile...', time: '2h', unread: true },
                { name: 'Bayern Munich', msg: 'Great performance last week!', time: '5h', unread: true },
                { name: 'Real Madrid Scout', msg: 'Would like to schedule a call', time: '1d', unread: true },
                { name: 'Ajax Coach', msg: 'Training schedule update', time: '2d', unread: false },
              ].map((conv, i) => (
                <div key={i} className={`p-3 rounded-lg cursor-pointer transition ${conv.unread ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-900">{conv.name}</span>
                    <span className="text-xs text-gray-500">{conv.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conv.msg}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 shadow-sm border-0">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  LFC
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Liverpool FC Scout</div>
                  <div className="text-xs text-gray-500">Active now</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Archive className="w-4 h-4 text-gray-600" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Trash2 className="w-4 h-4 text-gray-600" />
                </Button>
              </div>
            </div>
            <Separator className="mb-4" />

            <div className="space-y-4 mb-4 h-96 overflow-y-auto">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  LFC
                </div>
                <div className="bg-gray-100 rounded-lg p-3 max-w-md">
                  <p className="text-sm text-gray-900">Hi Desley, we've been following your performance this season and are very impressed with your stats.</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 flex-row-reverse">
                <div className="w-8 h-8 bg-green-600 rounded-full shrink-0" />
                <div className="bg-blue-600 rounded-lg p-3 max-w-md">
                  <p className="text-sm text-white">Thank you! I'm always looking for new opportunities to grow.</p>
                  <p className="text-xs text-blue-200 mt-1">1 hour ago</p>
                </div>
              </div>
            </div>

            {!canSendMessage ? (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 py-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <MessageCircle className="w-7 h-7 text-blue-600" />
                  </div>
                  <p className="font-bold text-gray-900 mb-2">Message Limit Reached</p>
                  <p className="text-sm text-gray-600 mb-4 text-center px-4">
                    You've used all 3 free messages. Upgrade for unlimited messaging.
                  </p>
                  <Button>Upgrade to Pro</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <Send className="w-4 h-4" />
                  Send
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NetworkContent() {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">My Network</h2>
      <div className="grid grid-cols-4 gap-6">
        {[
          { name: 'Michael Johnson', role: 'Scout', club: 'Manchester United', connected: true },
          { name: 'Carlos Rodriguez', role: 'Agent', club: 'Global Sports', connected: true },
          { name: 'Sarah Williams', role: 'Scout', club: 'Chelsea FC', connected: false },
          { name: 'Jean Dupont', role: 'Coach', club: 'Paris SG', connected: true },
          { name: 'Marco Rossi', role: 'Scout', club: 'AC Milan', connected: false },
          { name: 'Hans Mueller', role: 'Director', club: 'Bayern Munich', connected: true },
          { name: 'David Smith', role: 'Agent', club: 'Pro Sports', connected: false },
          { name: 'Luis Garcia', role: 'Scout', club: 'Barcelona', connected: true },
        ].map((person, i) => (
          <Card key={i} className="shadow-sm hover:shadow-lg transition border-0">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4">
                {person.name.split(' ').map(n => n[0]).join('')}
              </div>
              <p className="font-semibold text-gray-900 text-center mb-0.5">{person.name}</p>
              <p className="text-sm text-gray-600 text-center mb-0.5">{person.role}</p>
              <p className="text-xs text-gray-500 text-center mb-4">{person.club}</p>
              {person.connected ? (
                <Button variant="outline" className="w-full" size="sm">Connected</Button>
              ) : (
                <Button className="w-full" size="sm">Connect</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsContent() {
  const [toggles, setToggles] = useState({
    visible: true,
    publicStats: true,
    directMessages: true,
    emailNotifs: false,
  });

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Settings</h2>
      <div className="max-w-3xl space-y-6">
        <Card className="shadow-sm border-0">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold text-gray-900">Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Email Address</label>
              <Input type="email" defaultValue="desley.ubbink@example.com" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Phone Number</label>
              <Input type="tel" defaultValue="+31 6 12345678" />
            </div>
            <Button>Update Account</Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold text-gray-900">Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {([
              { key: 'visible', label: 'Profile visible to scouts' },
              { key: 'publicStats', label: 'Show performance stats publicly' },
              { key: 'directMessages', label: 'Allow direct messages' },
              { key: 'emailNotifs', label: 'Email notifications' },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-700">{label}</span>
                <Switch
                  checked={toggles[key]}
                  onCheckedChange={(val) => setToggles(t => ({ ...t, [key]: val }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold text-gray-900">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {['Current Password', 'New Password', 'Confirm New Password'].map((label) => (
              <div key={label}>
                <label className="text-sm text-gray-600 block mb-1">{label}</label>
                <Input type="password" />
              </div>
            ))}
            <Button>Change Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
function StatRow({ label, value, percentage }: { label: string; value: string; percentage: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function NavItem({ icon, text, active = false, badge, onClick }: { icon: React.ReactNode; text: string; active?: boolean; badge?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${
        active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-xs font-medium">{text}</span>
      </div>
      {badge && (
        <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-500 text-blue-600 bg-blue-50',
    green: 'border-green-500 text-green-600 bg-green-50',
    purple: 'border-purple-500 text-purple-600 bg-purple-50',
    orange: 'border-orange-500 text-orange-600 bg-orange-50',
    yellow: 'border-yellow-500 text-yellow-600 bg-yellow-50',
    red: 'border-red-500 text-red-600 bg-red-50',
  };

  return (
    <Card className={`shadow-sm border-l-4 border-t-0 border-r-0 border-b-0 rounded-xl ${colorClasses[color]}`}>
      <CardContent className="p-4">
        <div className="text-xs text-gray-600 mb-1">{label}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </CardContent>
    </Card>
  );
}
