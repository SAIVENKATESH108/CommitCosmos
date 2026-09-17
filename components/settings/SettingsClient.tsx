'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Settings,
  Sparkles,
  Shield,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Zap,
  Sliders,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AppNavbar } from '@/components/navigation/AppNavbar';
import { toast } from 'sonner';
import type { UserStats } from '@/db/schema';

interface SettingsClientProps {
  user: {
    id: string;
    githubUsername: string;
    name?: string | null;
    image?: string | null;
  };
  stats: UserStats | null;
  productionUrl: string;
  webhookSecret: string;
}

export function SettingsClient({
  user,
  stats,
  productionUrl,
  webhookSecret,
}: SettingsClientProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Client preference state (persisted to localStorage)
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('cc_reduced_motion') === 'true';
  });

  const [bloomEnabled, setBloomEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('cc_bloom_enabled') !== 'false';
  });

  const [defaultListView, setDefaultListView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('cc_default_list_view') === 'true';
  });

  const handleToggleReducedMotion = (checked: boolean) => {
    setReducedMotion(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cc_reduced_motion', String(checked));
      toast.success(checked ? 'Reduced motion enabled' : 'Motion animations restored');
    }
  };

  const handleToggleBloom = (checked: boolean) => {
    setBloomEnabled(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cc_bloom_enabled', String(checked));
      toast.success(checked ? 'High-dynamic bloom enabled' : 'Battery saver mode active');
    }
  };

  const handleToggleDefaultListView = (checked: boolean) => {
    setDefaultListView(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cc_default_list_view', String(checked));
      toast.success(checked ? 'Default view set to 2D List' : 'Default view set to 3D Galaxy');
    }
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleSyncRepos = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/repos/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully synced ${data.projectsCount} repositories!`);
      } else {
        toast.error(data.error || 'Failed to sync repositories');
      }
    } catch {
      toast.error('Failed to communicate with sync endpoint');
    } finally {
      setIsSyncing(false);
    }
  };

  const webhookUrl = `${productionUrl}/api/webhooks/github`;
  const profileUrl = `${productionUrl}/u/${user.githubUsername}`;

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <AppNavbar
        profileUsername={user.githubUsername}
        profileAvatarUrl={user.image}
        currentUser={user}
        currentStreak={stats?.currentStreak ?? 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Settings className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Cosmic Settings & Preferences
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Configure WebGL visual parameters, repository sync, and developer identity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/u/${user.githubUsername}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>View 3D Galaxy</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-xs font-medium text-violet-200 hover:text-white transition-all active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span>Observatory</span>
            </Link>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Visual & Performance Preferences */}
          <Card className="bg-slate-950/70 border-white/[0.08] backdrop-blur-xl shadow-2xl">
            <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>3D Graphics & Accessibility</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Tailor rendering fidelity and motion comfort for your hardware.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Reduced Motion */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-sm font-medium text-slate-200">Reduced Motion</span>
                  <p className="text-xs text-slate-400">
                    Snaps 3D camera immediately instead of smooth easing interpolation.
                  </p>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={handleToggleReducedMotion}
                  aria-label="Toggle reduced motion"
                />
              </div>

              {/* Bloom Post-Processing */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
                <div className="space-y-0.5">
                  <span className="text-sm font-medium text-slate-200">Emissive Bloom Effects</span>
                  <p className="text-xs text-slate-400">
                    High-dynamic glow halos on newly ignited stars and supernovas.
                  </p>
                </div>
                <Switch
                  checked={bloomEnabled}
                  onCheckedChange={handleToggleBloom}
                  aria-label="Toggle bloom effects"
                />
              </div>

              {/* Default List View */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
                <div className="space-y-0.5">
                  <span className="text-sm font-medium text-slate-200">Default to 2D Table</span>
                  <p className="text-xs text-slate-400">
                    Always load the accessible 2D table view first instead of the 3D canvas.
                  </p>
                </div>
                <Switch
                  checked={defaultListView}
                  onCheckedChange={handleToggleDefaultListView}
                  aria-label="Toggle default 2D list view"
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Developer Identity & Database */}
          <Card className="bg-slate-950/70 border-white/[0.08] backdrop-blur-xl shadow-2xl">
            <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Cosmonaut Account</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Connected GitHub OAuth credentials and storage engine.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* User Bio Card */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.githubUsername}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border border-violet-500/40"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white">
                    {user.githubUsername.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-white truncate">
                    {user.name || user.githubUsername}
                  </h2>
                  <p className="text-xs font-mono text-violet-300 truncate">
                    @{user.githubUsername}
                  </p>
                  <span className="inline-block text-[10px] text-emerald-400 font-medium mt-0.5">
                    ● GitHub OAuth Connected
                  </span>
                </div>
              </div>

              {/* Neon Lakebase Postgres Status */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300 font-medium">Storage Engine</span>
                </div>
                <span className="font-mono text-slate-400">Neon Lakebase Postgres</span>
              </div>

              {/* One-click Sync Action */}
              <div className="pt-2">
                <Button
                  onClick={handleSyncRepos}
                  disabled={isSyncing}
                  className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Synchronizing Repositories...' : 'Sync All Repositories Now'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Webhook Integration Details */}
        <Card className="bg-slate-950/70 border-white/[0.08] backdrop-blur-xl shadow-2xl">
          <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Real-Time Webhook Pipeline</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              HMAC-SHA256 signature verification payload credentials for automatic star ignition on push.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Payload URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Payload URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-xl bg-black/80 border border-white/10 text-xs font-mono text-cyan-300 truncate">
                  {webhookUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(webhookUrl, 'url')}
                  className="h-9 px-3 rounded-xl border-white/10 hover:bg-white/10 text-xs"
                >
                  {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {/* Secret */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Secret Token</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-xl bg-black/80 border border-white/10 text-xs font-mono text-violet-300 truncate">
                  {showSecret ? webhookSecret : '••••••••••••••••••••••••••••••••'}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecret(!showSecret)}
                  className="h-9 px-3 rounded-xl border-white/10 hover:bg-white/10 text-xs"
                  aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(webhookSecret, 'secret')}
                  className="h-9 px-3 rounded-xl border-white/10 hover:bg-white/10 text-xs"
                >
                  {copiedField === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              <Link
                href="/dashboard"
                className="text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1"
              >
                <span>View instructions for GitHub Webhook configuration</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="font-mono text-[11px] text-slate-500">HMAC-SHA256 Strict</span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Public Galaxy URL */}
        <Card className="bg-slate-950/70 border-white/[0.08] backdrop-blur-xl shadow-2xl">
          <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Public Galaxy Profile URL</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Your public interactive 3D universe showcase, accessible to anyone on the web.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl bg-black/80 border border-white/10 text-xs font-mono text-cyan-300 truncate">
                {profileUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(profileUrl, 'profile')}
                className="h-9 px-3 rounded-xl border-white/10 hover:bg-white/10 text-xs"
              >
                {copiedField === 'profile' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Link
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-9 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                <span>Visit</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
