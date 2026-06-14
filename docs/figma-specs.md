GlobalScout — Next.js Implementation Guide
1. Page Structure
app/
├── layout.tsx                          ← Root layout (fonts, providers, ThemeProvider)
├── globals.css                         ← shadcn/ui tokens + GlobalScout overrides
├── page.tsx                            ← Landing page
│
├── (auth)/
│   ├── layout.tsx                      ← Shared dark-gradient auth layout
│   ├── sign-in/
│   │   └── page.tsx                    ← Sign-in form
│   ├── create-account/
│   │   └── page.tsx                    ← Create account form
│   └── forgot-password/
│       └── page.tsx                    ← Password reset
│
├── onboarding/
│   ├── layout.tsx                      ← Progress header layout
│   ├── account-type/
│   │   └── page.tsx                    ← Screen 1 – Player vs Agent
│   ├── empty-profile/
│   │   └── page.tsx                    ← Screen 2 – Incomplete profile
│   ├── connect/
│   │   └── page.tsx                    ← Screen 3 – Player info form
│   ├── searching/
│   │   └── page.tsx                    ← Screen 4 – Animated search
│   ├── match-results/
│   │   └── page.tsx                    ← Screen 5 – Identity matches
│   ├── claim/
│   │   └── page.tsx                    ← Screen 6 – Claim profile
│   └── submitted/
│       └── page.tsx                    ← Screen 7 – Claim submitted
│
└── dashboard/
    ├── layout.tsx                      ← Sidebar layout
    ├── page.tsx                        ← Player dashboard (pending)
    ├── verified/
    │   └── page.tsx                    ← Player dashboard (verified)
    └── scout/
        ├── page.tsx                    ← Scout overview
        ├── search/
        │   └── page.tsx                ← Player search
        ├── ai-scout/
        │   └── page.tsx                ← AI Scout tool
        ├── messages/
        │   └── page.tsx                ← Messages
        ├── network/
        │   └── page.tsx                ← Network
        ├── profile/
        │   └── page.tsx                ← Scout profile
        └── settings/
            └── page.tsx                ← Settings
Layout sections per page
Route	Sections in order
/	<Navbar> (transparent→solid) · Hero · Stats bar · For Players · For Scouts · For Clubs · How It Works · CTA · Footer
/(auth)/sign-in	Brand panel (left) · <SignInForm> card (right)
/(auth)/create-account	Brand panel (left) · <CreateAccountForm> card (right)
/(auth)/forgot-password	Centered <ForgotPasswordCard>
/onboarding/account-type	Full-screen dark · Logo · Title/subtitle · Two <AccountTypeCard>
/onboarding/empty-profile	<OnboardingHeader> · Incomplete banner · Empty profile skeleton · Connect CTA sidebar
/onboarding/connect	<OnboardingHeader step={1}> · Icon · Title · <PlayerInfoForm>
/onboarding/searching	Full-screen dark · Pulsing orb · Rotating messages · Progress bar
/onboarding/match-results	<OnboardingHeader step={3}> · Title · <MatchResultCard> × 3 · "Can't find" link
/onboarding/claim	<OnboardingHeader step={4}> · Title · Side-by-side comparison · Info panel · CTAs
/onboarding/submitted	Full-screen dark · Success icon · Title · Timeline · Info card · Buttons
/dashboard	<DashboardSidebar> · <DashboardHeader> · Verification banner · Profile header · Stats · Content grid
/dashboard/verified	Same as above, green verified state, no banner
/dashboard/scout	<DashboardSidebar> · <DashboardHeader> · Profile hero · Stats · Watched players / Reports / Upcoming
2. Component Breakdown
Shared / Layout
components/
├── layout/
│   ├── Navbar.tsx            ← transparent→solid on scroll
│   ├── OnboardingHeader.tsx  ← progress dots + back button
│   ├── DashboardSidebar.tsx  ← fixed sidebar with nav items
│   └── DashboardHeader.tsx   ← search bar + notifications + avatar
│
├── ui/                       ← shadcn/ui (generated, do not hand-write)
│   └── ...
│
├── auth/
│   ├── SignInForm.tsx
│   ├── CreateAccountForm.tsx
│   ├── ForgotPasswordForm.tsx
│   ├── SocialAuthButtons.tsx
│   └── PasswordStrengthBar.tsx
│
├── onboarding/
│   ├── AccountTypeCard.tsx
│   ├── EmptyProfileSkeleton.tsx
│   ├── ConnectIdentityCard.tsx
│   ├── PlayerInfoForm.tsx
│   ├── SearchingAnimation.tsx
│   ├── MatchResultCard.tsx
│   ├── ClaimProfileComparison.tsx
│   ├── VerificationTimeline.tsx
│   └── SubmittedInfoCard.tsx
│
├── dashboard/
│   ├── StatCard.tsx
│   ├── VerificationBanner.tsx
│   ├── PlayerProfileHeader.tsx
│   ├── VideoHighlightCard.tsx
│   ├── PerformanceRadarChart.tsx
│   ├── ProfileViewsChart.tsx
│   ├── MatchHistoryList.tsx
│   ├── RecentActivityList.tsx
│   └── UpcomingMatchList.tsx
│
└── landing/
    ├── HeroSection.tsx
    ├── StatsBar.tsx
    ├── FeatureSection.tsx
    ├── HowItWorksSection.tsx
    ├── CtaSection.tsx
    └── Footer.tsx
shadcn/ui component map
Custom component	shadcn/ui primitives used
SignInForm	Card CardContent, Input, Label, Button
CreateAccountForm	Card CardContent, Input, Label, Button
AccountTypeCard	Card CardContent, Badge, Button
ConnectIdentityCard	Card CardContent, Badge, Button
PlayerInfoForm	Card CardContent, Input, Label, Select SelectTrigger SelectContent SelectItem, Button
MatchResultCard	Card CardContent, Badge, Avatar AvatarImage AvatarFallback, Button, Separator
ClaimProfileComparison	Card CardContent, Separator, Alert AlertDescription, Button
VerificationTimeline	Card CardContent (custom list)
VerificationBanner	Alert AlertTitle AlertDescription, Button
StatCard	Card CardContent
DashboardSidebar	Button (nav items), Badge, Separator
PasswordStrengthBar	Progress
PlayerProfileHeader	Avatar AvatarImage AvatarFallback, Badge, Button
Settings page toggles	Switch, Label
Messages page	Tabs TabsList TabsTrigger TabsContent, Input, Button, Avatar
Network page	Card, Avatar, Button, Badge
Scout search filters	Select, Input, Button
3. Tailwind Implementation Notes
Navbar — transparent → solid
// Transparent over hero, solid after scroll
const scrolled = useScrolled(60); // custom hook, window.scrollY > 60

<nav className={cn(
  "fixed top-0 w-full z-50 transition-all duration-300",
  scrolled
    ? "bg-white/95 backdrop-blur-md shadow-sm"
    : "bg-transparent"
)}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      <Logo className={scrolled ? "" : "brightness-0 invert"} />
      <nav className="hidden md:flex items-center gap-8">
        <NavLink href="#features" scrolled={scrolled}>Features</NavLink>
        ...
      </nav>
    </div>
  </div>
</nav>
// NavLink — white on dark hero, gray on white bg
function NavLink({ scrolled, href, children }) {
  return (
    <a href={href} className={cn(
      "text-sm transition-colors",
      scrolled
        ? "text-gray-700 hover:text-blue-600"
        : "text-white/90 hover:text-white"
    )}>
      {children}
    </a>
  );
}
Hero section — full-bleed image with overlay
<section className="relative min-h-[90vh] flex items-center overflow-hidden">
  {/* Full-bleed background */}
  <div className="absolute inset-0 -z-10">
    <Image src="/hero-stadium.jpg" alt="" fill className="object-cover" priority />
    <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/85 to-gray-900/75" />
  </div>

  {/* Content */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
    <div className="max-w-3xl">
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
        Connect Football Talent{" "}
        <span className="text-blue-400">Worldwide</span>
      </h1>
      ...
    </div>
  </div>
</section>
Stats bar
<div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8
                bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8
                border border-white/20">
Auth layout — two-column
// app/(auth)/layout.tsx
<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950
                flex flex-col">
  <header className="px-6 py-5 flex items-center justify-between">...</header>
  <div className="flex-1 flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden md:block">...</div>
      {/* Right form */}
      <div>{children}</div>
    </div>
  </div>
</div>
Onboarding header — progress dots
<header className="bg-white border-b border-gray-200 sticky top-0 z-50">
  <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      {onBack && <BackButton />}
      <Logo className="h-8 w-auto" />
    </div>
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i < currentStep ? "bg-blue-600 w-8" : "bg-gray-200 w-4"
          )} />
        ))}
      </div>
      <span className="text-xs text-gray-500">{currentStep}/{totalSteps}</span>
    </div>
  </div>
</header>
Account type cards — equal weight
// Both cards use the same outer wrapper; Player is styled in blue, Agent in dark glass
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
  {/* Player */}
  <button className="group relative text-left rounded-2xl p-8
                     bg-gradient-to-br from-blue-600 to-blue-700
                     border border-blue-500 hover:border-blue-400
                     transition-all duration-200 hover:scale-[1.02]
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-white">
    ...
  </button>

  {/* Agent */}
  <button className="group relative text-left rounded-2xl p-8
                     bg-white/5 border border-white/10
                     hover:border-white/20 hover:scale-[1.02]
                     transition-all duration-200
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-white">
    ...
  </button>
</div>
Match result card
<Card className={cn(
  "overflow-hidden transition-shadow hover:shadow-md",
  recommended && "ring-2 ring-blue-500"
)}>
  {recommended && (
    <div className="bg-blue-600 px-5 py-2 flex items-center gap-2">
      <Star className="w-3.5 h-3.5 text-white fill-white" />
      <span className="text-white text-xs font-semibold">Recommended Match</span>
    </div>
  )}
  <CardContent className="p-6">
    <div className="flex items-start gap-5">
      <div className="relative shrink-0">
        <Avatar className="w-20 h-20 rounded-xl">
          <AvatarImage src={player.photo} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <Badge className={cn("absolute -top-2 -right-2 text-xs font-bold", confidenceColor)}>
          {player.confidence}%
        </Badge>
      </div>
      ...
    </div>
  </CardContent>
</Card>
Dashboard sidebar
<aside className="w-48 bg-gradient-to-b from-slate-900 to-slate-800
                  fixed h-full flex flex-col overflow-y-auto">
Dashboard stat cards — colored left border
// Use a data-attribute approach to avoid Tailwind purging dynamic classes
const colorMap = {
  blue:   "border-l-blue-500   bg-blue-50   text-blue-600",
  green:  "border-l-green-500  bg-green-50  text-green-600",
  purple: "border-l-purple-500 bg-purple-50 text-purple-600",
} as const;

<Card className={cn("border-l-4 border-t-0 border-r-0 border-b-0 shadow-sm", colorMap[color])}>
  <CardContent className="p-4">
    <p className="text-xs text-gray-600 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </CardContent>
</Card>
Verification banner states
// Pending — amber
<Alert className="border-amber-200 bg-amber-50">
  <Clock className="h-4 w-4 text-amber-600" />
  <AlertTitle className="text-amber-900">Verification in Progress</AlertTitle>
  <AlertDescription className="text-amber-700">
    Our team is reviewing your football identity.
    Estimated review time: <strong>24–48 hours</strong>
  </AlertDescription>
</Alert>

// Verified — green
<Alert className="border-green-200 bg-green-50">
  <BadgeCheck className="h-4 w-4 text-green-600" />
  <AlertTitle className="text-green-900">Verified Football Profile</AlertTitle>
  ...
</Alert>
4. Design Tokens
Paste this into app/globals.css, replacing the shadcn/ui defaults:

@layer base {
  :root {
    /* ── Brand ──────────────────────────────── */
    --background:          0 0% 100%;
    --foreground:          222 47% 11%;        /* gray-900 */

    --card:                0 0% 100%;
    --card-foreground:     222 47% 11%;

    --popover:             0 0% 100%;
    --popover-foreground:  222 47% 11%;

    /* Primary = GlobalScout blue */
    --primary:             221 83% 53%;        /* #2563eb */
    --primary-foreground:  0 0% 100%;

    --secondary:           215 28% 17%;        /* slate-800 */
    --secondary-foreground:0 0% 100%;

    --muted:               220 14% 96%;        /* gray-100 */
    --muted-foreground:    220 9% 46%;         /* gray-500 */

    --accent:              214 100% 97%;       /* blue-50 */
    --accent-foreground:   221 83% 53%;        /* blue-600 */

    --destructive:         0 72% 51%;          /* red-600 */
    --destructive-foreground: 0 0% 100%;

    --border:              220 13% 91%;        /* gray-200 */
    --input:               220 13% 91%;
    --ring:                221 83% 53%;        /* blue-600 */

    /* ── Sidebar ────────────────────────────── */
    --sidebar-bg:          222 47% 11%;        /* slate-900 */
    --sidebar-bg-end:      215 28% 17%;        /* slate-800 */
    --sidebar-foreground:  210 40% 98%;
    --sidebar-active:      221 83% 53%;        /* blue-600 */
    --sidebar-hover:       215 28% 25%;

    /* ── Status ─────────────────────────────── */
    --verified:            142 71% 45%;        /* green-500 */
    --verified-bg:         138 76% 97%;        /* green-50 */
    --pending:             38 92% 50%;         /* amber-500 */
    --pending-bg:          48 100% 96%;        /* amber-50 */

    /* ── Radius ─────────────────────────────── */
    --radius:              0.625rem;           /* 10px — shadcn default */
    --radius-lg:           1rem;               /* 16px */
    --radius-xl:           1.25rem;            /* 20px */
    --radius-2xl:          1.5rem;             /* 24px */

    /* ── Shadows ────────────────────────────── */
    --shadow-card:         0 1px 3px 0 rgb(0 0 0 / 0.1),
                           0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-lg:           0 10px 15px -3px rgb(0 0 0 / 0.1),
                           0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  .dark {
    --background:          222 47% 11%;
    --foreground:          210 40% 98%;
    --card:                215 28% 17%;
    --card-foreground:     210 40% 98%;
    --primary:             213 94% 68%;        /* blue-400 in dark */
    --primary-foreground:  222 47% 11%;
    --muted:               215 28% 17%;
    --muted-foreground:    215 20% 65%;
    --border:              215 28% 25%;
    --input:               215 28% 25%;
  }
}
Typography scale
/* globals.css — after @layer base tokens */
@layer base {
  h1 { @apply text-5xl md:text-6xl font-bold tracking-tight; }
  h2 { @apply text-3xl md:text-4xl font-bold; }
  h3 { @apply text-xl md:text-2xl font-bold; }
  h4 { @apply text-base font-semibold; }
  p  { @apply text-base leading-relaxed; }
}
Spacing & breakpoints (Tailwind defaults — no overrides needed)
Token	Value
sm	640px
md	768px
lg	1024px
xl	1280px
2xl	1536px
Container max	max-w-7xl (1280px)
Dashboard sidebar width	w-48 (192px)
Onboarding form max	max-w-xl (576px)
Auth layout max	max-w-4xl (896px)
5. Assets
public/
├── logo/
│   ├── globalscout-logo.svg        ← primary logo (compass mark + wordmark)
│   ├── globalscout-mark.svg        ← compass mark only (sidebar, favicon)
│   └── globalscout-logo-white.svg  ← inverted for dark backgrounds
│
├── images/
│   ├── hero-stadium.jpg            ← 1920×1080, WebP preferred
│   ├── feature-player.jpg          ← 800×600 player action shot
│   ├── feature-scout.jpg           ← 800×600 scout analysing
│   └── feature-team.jpg            ← 800×600 club/team photo
│
└── favicon.ico                     ← 32×32 compass mark
All icons use lucide-react — no custom icon assets needed. Key icons per section:

Section	Icons
Landing hero buttons	Users, Search, Trophy
Features list	Video, BarChart3, Target, MessageCircle, Award, Star, Clock, TrendingUp
Auth forms	Mail, Lock, User, Eye, EyeOff, ChevronRight
Onboarding	Shield, BadgeCheck, UserCheck, Check, Clock, Sparkles, MapPin, Calendar
Dashboard sidebar	Home, User, BarChart3, Video, MessageCircle, Users, Settings, Bot
Verification states	BadgeCheck (green, verified), Clock (amber, pending), AlertCircle (warning)
6. Interaction States
Buttons
State	Classes
Default	bg-primary text-primary-foreground
Hover	hover:bg-primary/90
Active	active:scale-[0.98]
Disabled	disabled:opacity-50 disabled:pointer-events-none
Loading	Replace children with <Loader2 className="animate-spin" /> + text
Destructive	variant="destructive"
Form inputs
State	Classes
Default	border-input bg-background
Focus	focus-visible:ring-2 focus-visible:ring-ring
Error	border-destructive focus-visible:ring-destructive
Disabled	disabled:opacity-50 disabled:cursor-not-allowed
Valid (confirm password)	append <CheckCircle2 className="text-green-500"> inside wrapper
Match result card
State	Description
Default	White card, border-gray-200
Recommended	ring-2 ring-blue-500 + blue banner strip
Hover	hover:shadow-md transition-shadow
Selected ("This Is Me" clicked)	Card disappears, navigate to /onboarding/claim
Dismissed ("Not Me" clicked)	Remove from list; if list empty show "Search Again"
Verification badge
State	Classes
Unverified	border-amber-300 bg-amber-50 text-amber-700
Pending	Same as unverified + <Clock> icon
Verified	bg-green-500 text-white border-0 + <BadgeCheck> icon
Navbar
State	Classes
At top (over hero)	bg-transparent · white links · ghost-white buttons
Scrolled (> 60px)	bg-white/95 backdrop-blur-md shadow-sm · gray links · standard buttons
Transition	transition-all duration-300
7. User Flows
Landing
  │
  ├── "Sign In" → /sign-in
  │     ├── Valid credentials
  │     │     ├── role === 'player' → /dashboard
  │     │     └── role === 'scout'  → /dashboard/scout
  │     └── "Forgot password?" → /forgot-password
  │           └── Submit email → success state → back to /sign-in
  │
  └── "Get Started" / "Join as Player" → /create-account
        └── Submit form → /onboarding/account-type
              │
              ├── "Continue as Player" → /onboarding/empty-profile
              │     │
              │     ├── "Skip For Now" → /dashboard (pending, no stats)
              │     │
              │     └── "Connect My Football Profile"
              │           └── /onboarding/connect         (step 1/4)
              │                 └── Submit form
              │                       └── /onboarding/searching  (step 2/4, auto-advance ~3s)
              │                             └── /onboarding/match-results  (step 3/4)
              │                                   │
              │                                   ├── "Not Me" on all cards
              │                                   │     └── "I Can't Find My Profile"
              │                                   │           → /onboarding/connect (retry)
              │                                   │
              │                                   └── "This Is Me"
              │                                         └── /onboarding/claim  (step 4/4)
              │                                               ├── "Choose Another Profile"
              │                                               │     → /onboarding/match-results
              │                                               └── "Claim Profile"
              │                                                     → /onboarding/submitted
              │                                                           ├── "View My Profile"
              │                                                           │     → /dashboard (pending)
              │                                                           └── "Continue"
              │                                                                 → /dashboard (pending)
              │
              └── "Continue as Agent" → (agent onboarding, out of scope)
State persistence across onboarding steps
Use a server-side session or lightweight Zustand/React Context store:

interface OnboardingState {
  accountType:    'player' | 'agent' | null;
  playerInfo:     PlayerInfoFormValues | null;
  selectedMatchId: number | null;
}
Pass selectedMatchId through search params when navigating from match-results → claim:

/onboarding/claim?matchId=1
8. Sample Code
app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 221 83% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary: 215 28% 17%;
    --secondary-foreground: 0 0% 100%;
    --muted: 220 14% 96%;
    --muted-foreground: 220 9% 46%;
    --accent: 214 100% 97%;
    --accent-foreground: 221 83% 53%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 221 83% 53%;
    --radius: 0.625rem;
  }
  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --card: 215 28% 17%;
    --card-foreground: 210 40% 98%;
    --primary: 213 94% 68%;
    --primary-foreground: 222 47% 11%;
    --muted: 215 28% 17%;
    --muted-foreground: 215 20% 65%;
    --border: 215 28% 25%;
    --input: 215 28% 25%;
  }
}
lib/hooks/use-scroll.ts
"use client";
import { useEffect, useState } from "react";

export function useScrolled(threshold = 60) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}
components/layout/Navbar.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useScrolled } from "@/lib/hooks/use-scroll";

export function Navbar() {
  const scrolled = useScrolled(60);

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <Image
              src="/logo/globalscout-logo.svg"
              alt="GlobalScout"
              width={140}
              height={40}
              className={cn(
                "h-10 w-auto transition-all duration-300",
                scrolled ? "" : "brightness-0 invert"
              )}
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {(["Features", "How It Works", "About"] as const).map((label) => (
              <Link
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "text-sm transition-colors",
                  scrolled
                    ? "text-gray-700 hover:text-blue-600"
                    : "text-white/90 hover:text-white"
                )}
              >
                {label}
              </Link>
            ))}

            <Button
              variant="outline"
              size="sm"
              asChild
              className={cn(
                scrolled
                  ? "border-blue-600 text-blue-600 hover:bg-blue-50"
                  : "border-white/60 text-white bg-white/10 hover:bg-white/20"
              )}
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>

            <Button size="sm" asChild>
              <Link href="/create-account">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
components/onboarding/OnboardingHeader.tsx
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingHeaderProps {
  step?: number;
  totalSteps?: number;
  backHref?: string;
}

export function OnboardingHeader({
  step,
  totalSteps,
  backHref,
}: OnboardingHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
          )}
          <Image
            src="/logo/globalscout-mark.svg"
            alt="GlobalScout"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
        </div>

        {step && totalSteps && (
          <div className="flex items-center gap-3" aria-label={`Step ${step} of ${totalSteps}`}>
            <div className="flex gap-1.5" role="list">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  role="listitem"
                  aria-current={i + 1 === step ? "step" : undefined}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i < step ? "bg-blue-600 w-8" : "bg-gray-200 w-4"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {step}/{totalSteps}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
app/onboarding/account-type/page.tsx
import Link from "next/link";
import { Users, Zap, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function AccountTypePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between">
        <Image
          src="/logo/globalscout-logo.svg"
          alt="GlobalScout"
          width={140}
          height={40}
          className="h-10 w-auto brightness-0 invert"
        />
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          Exit
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30
                          text-blue-300 px-4 py-1.5 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" aria-hidden />
            Welcome to GlobalScout
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to Global Scout
          </h1>
          <p className="text-xl text-gray-400">
            Tell us how you&apos;ll use the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Player */}
          <Link
            href="/onboarding/empty-profile"
            className="group relative rounded-2xl p-8 bg-gradient-to-br from-blue-600 to-blue-700
                       border border-blue-500 hover:border-blue-400
                       hover:scale-[1.02] transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-xl opacity-0
                            group-hover:opacity-20 transition-opacity -z-10" />
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-white" aria-hidden />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Player</h2>
            <p className="text-blue-100 mb-8 leading-relaxed">
              Showcase your career, statistics, achievements and get discovered
              by scouts and clubs.
            </p>
            <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold"
                    tabIndex={-1}>
              Continue as Player
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>

          {/* Agent */}
          <Link
            href="/onboarding/agent"
            className="group relative rounded-2xl p-8 bg-white/5
                       border border-white/10 hover:border-white/20
                       hover:scale-[1.02] transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-gray-300" aria-hidden />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Agent</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Manage players, discover talent and connect with clubs and scouts.
            </p>
            <Button
              variant="outline"
              className="w-full border-white/20 text-white bg-white/5 hover:bg-white/10 font-semibold"
              tabIndex={-1}
            >
              Continue as Agent
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <p className="text-gray-500 text-sm mt-8">
          You can change this later in your account settings.
        </p>
      </main>
    </div>
  );
}
app/onboarding/connect/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";

const schema = z.object({
  fullName:     z.string().min(2, "Required"),
  dateOfBirth:  z.string().min(1, "Required"),
  nationality:  z.string().min(2, "Required"),
  currentClub:  z.string().min(2, "Required"),
  previousClub: z.string().optional(),
  position:     z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

const POSITIONS = [
  "Goalkeeper (GK)",
  "Defender (CB)",
  "Defender (LB / RB)",
  "Midfielder (CDM)",
  "Midfielder (CM)",
  "Midfielder (CAM)",
  "Forward (LW / RW)",
  "Forward (ST)",
] as const;

export default function ConnectPage() {
  const router = useRouter();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit(_values: FormValues) {
    // Persist to session/store here, then navigate
    router.push("/onboarding/searching");
  }

  return (
    <>
      <OnboardingHeader step={1} totalSteps={4} backHref="/onboarding/empty-profile" />

      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Search className="w-7 h-7 text-blue-600" aria-hidden />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Help us find your football profile
          </h1>
          <p className="text-gray-500">
            We&apos;ll use this information to search football databases.
          </p>
        </div>

        <Card className="shadow-sm border-border">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="nationality" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Netherlands" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="currentClub" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Club</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ajax Amsterdam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="previousClub" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Previous Club{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. FC Groningen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="position" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POSITIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" size="lg" className="w-full">
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-5 px-4">
          We only use this information to find your football profile.
          Your data is never shared with third parties.
        </p>
      </main>
    </>
  );
}
components/onboarding/MatchResultCard.tsx
import { Check, X, MapPin, Trophy, Calendar, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface PlayerMatch {
  id: number;
  name: string;
  nationality: string;
  team: string;
  league: string;
  position: string;
  age: number;
  confidence: number;
  photo: string;
  reasons: string[];
  recommended: boolean;
}

interface MatchResultCardProps {
  match: PlayerMatch;
  onSelect: (match: PlayerMatch) => void;
  onDismiss: (id: number) => void;
}

function confidenceBadgeClass(confidence: number) {
  if (confidence >= 85) return "bg-green-100 text-green-700 border-green-200";
  if (confidence >= 70) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

export function MatchResultCard({ match, onSelect, onDismiss }: MatchResultCardProps) {
  const initials = match.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <Card className={cn(
      "overflow-hidden transition-shadow hover:shadow-md",
      match.recommended && "ring-2 ring-blue-500"
    )}>
      {match.recommended && (
        <div className="bg-blue-600 px-5 py-2 flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-white fill-white" aria-hidden />
          <span className="text-white text-xs font-semibold">Recommended Match</span>
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-start gap-5">
          {/* Avatar + confidence badge */}
          <div className="relative shrink-0">
            <Avatar className="w-20 h-20 rounded-xl">
              <AvatarImage src={match.photo} alt={match.name} />
              <AvatarFallback className="rounded-xl text-lg font-bold bg-blue-100 text-blue-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Badge
              className={cn(
                "absolute -top-2 -right-2 text-xs font-bold border",
                confidenceBadgeClass(match.confidence)
              )}
            >
              {match.confidence}%
            </Badge>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg mb-1">{match.name}</h3>

            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" aria-hidden />
                <dd>{match.nationality}</dd>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" aria-hidden />
                <dd>{match.team}</dd>
              </div>
              <dd>{match.league}</dd>
              <dd>{match.position}</dd>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" aria-hidden />
                <dd>{match.age} years</dd>
              </div>
            </dl>

            {/* Reasoning */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Why we think this is you:
              </p>
              <ul className="space-y-1">
                {match.reasons.map((reason) => (
                  <li key={reason} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" aria-hidden />
                    <span className="text-xs text-gray-700">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onSelect(match)}
              >
                <Check className="w-4 h-4" />
                This Is Me
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onDismiss(match.id)}
              >
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
components/dashboard/VerificationBanner.tsx
import Link from "next/link";
import { Clock, BadgeCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VerificationStatus = "pending" | "verified";

interface VerificationBannerProps {
  status: VerificationStatus;
}

const config = {
  pending: {
    icon: Clock,
    wrapperClass: "border-amber-200 bg-amber-50",
    iconClass: "text-amber-600",
    titleClass: "text-amber-900",
    descClass: "text-amber-700",
    title: "Verification in Progress",
    description: "Our team is reviewing your football identity.",
    detail: "Estimated review time: 24–48 hours",
    cta: "View Verification Status",
    href: "/dashboard/verification",
  },
  verified: {
    icon: BadgeCheck,
    wrapperClass: "border-green-200 bg-green-50",
    iconClass: "text-green-600",
    titleClass: "text-green-900",
    descClass: "text-green-700",
    title: "Verified Football Profile",
    description: "Your identity has been confirmed by the GlobalScout team.",
    detail: null,
    cta: null,
    href: null,
  },
} as const;

export function VerificationBanner({ status }: VerificationBannerProps) {
  const c = config[status];
  const Icon = c.icon;

  return (
    <Alert className={cn("flex items-start gap-4", c.wrapperClass)}>
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", c.iconClass)} aria-hidden />
      <div className="flex-1">
        <AlertTitle className={cn("font-semibold", c.titleClass)}>
          {c.title}
        </AlertTitle>
        <AlertDescription className={c.descClass}>
          {c.description}
          {c.detail && (
            <> {c.detail}</>
          )}
        </AlertDescription>
      </div>
      {c.cta && c.href && (
        <Button size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700" asChild>
          <Link href={c.href}>{c.cta}</Link>
        </Button>
      )}
    </Alert>
  );
}
components/dashboard/StatCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Color = "blue" | "green" | "purple" | "orange" | "amber" | "red";

interface StatCardProps {
  label: string;
  value: string;
  color: Color;
}

const colorMap: Record<Color, string> = {
  blue:   "border-l-blue-500   bg-blue-50",
  green:  "border-l-green-500  bg-green-50",
  purple: "border-l-purple-500 bg-purple-50",
  orange: "border-l-orange-500 bg-orange-50",
  amber:  "border-l-amber-500  bg-amber-50",
  red:    "border-l-red-500    bg-red-50",
};

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <Card className={cn(
      "border-l-4 border-t-0 border-r-0 border-b-0 shadow-sm rounded-xl",
      colorMap[color]
    )}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
components/layout/DashboardSidebar.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home, User, BarChart3, Video, MessageCircle,
  Users, Settings, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const playerNav = [
  { href: "/dashboard",            icon: Home,          label: "Dashboard" },
  { href: "/dashboard/profile",    icon: User,          label: "My Profile" },
  { href: "/dashboard/statistics", icon: BarChart3,     label: "Statistics" },
  { href: "/dashboard/videos",     icon: Video,         label: "Videos" },
  { href: "/dashboard/messages",   icon: MessageCircle, label: "Messages", badge: "3" },
  { href: "/dashboard/network",    icon: Users,         label: "My Network" },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 bg-gradient-to-b from-slate-900 to-slate-800
                      fixed h-full flex flex-col overflow-y-auto z-40">
      <div className="p-4 flex-1">
        <Image
          src="/logo/globalscout-mark.svg"
          alt="GlobalScout"
          width={96}
          height={96}
          className="h-24 w-auto mb-6 mx-auto brightness-0 invert"
        />
        <nav className="space-y-1" aria-label="Dashboard navigation">
          {playerNav.map(({ href, icon: Icon, label, badge }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-slate-700 hover:text-white"
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4" aria-hidden />
                  <span className="text-xs font-medium">{label}</span>
                </span>
                {badge && (
                  <Badge className="bg-blue-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                    {badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-4 py-3 border-t border-slate-700">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs font-medium",
            pathname === "/dashboard/settings"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-slate-700 hover:text-white"
          )}
        >
          <Settings className="w-4 h-4" aria-hidden />
          Settings
        </Link>
      </div>

      {/* Upgrade card */}
      <div className="m-3 p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
        <p className="font-semibold text-white text-xs mb-1">Upgrade to Pro</p>
        <p className="text-xs text-gray-300 mb-2">Get unlimited visibility</p>
        <Button size="sm" className="w-full text-xs h-7">
          Upgrade Now
        </Button>
      </div>
    </aside>
  );
}
Required shadcn/ui components to install
npx shadcn-ui@latest add \
  button card input label select badge avatar \
  alert progress tabs separator dialog \
  form switch dropdown-menu sheet tooltip
Required npm packages
npm install \
  lucide-react \
  recharts \
  react-hook-form \
  @hookform/resolvers \
  zod \
  next-themes \
  clsx \
  tailwind-merge


home
