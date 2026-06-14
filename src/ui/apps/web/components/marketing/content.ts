import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Clock,
  MessageCircle,
  Search,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Video,
} from "lucide-react";

export interface LandingStat {
  value: string;
  label: string;
}

export interface FeatureListItem {
  icon: LucideIcon;
  text: string;
}

export interface AudienceSection {
  id: string;
  headingIcon: LucideIcon;
  iconBgClass: string;
  iconClass: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  features: FeatureListItem[];
  /** Image column appears first on desktop */
  imageFirst?: boolean;
  /** Image column appears first on mobile */
  mobileImageFirst?: boolean;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const landingStats: LandingStat[] = [
  { value: "50K+", label: "Active Players" },
  { value: "2,500+", label: "Professional Scouts" },
  { value: "800+", label: "Clubs Worldwide" },
  { value: "120+", label: "Countries" },
];

export const audienceSections: AudienceSection[] = [
  {
    id: "for-players",
    headingIcon: Users,
    iconBgClass: "bg-blue-100",
    iconClass: "text-blue-600",
    title: "For Players",
    subtitle:
      "Showcase your talent to scouts and clubs worldwide with professional profiles, video highlights, and performance analytics.",
    imageSrc: "/images/feature-player.jpg",
    imageAlt: "Football player in action",
    mobileImageFirst: true,
    features: [
      { icon: Video, text: "Video portfolio management" },
      { icon: BarChart3, text: "Performance tracking & analytics" },
      { icon: Target, text: "Opportunity notifications" },
      { icon: MessageCircle, text: "Direct messaging with scouts & clubs" },
      { icon: Award, text: "Achievement & stats showcase" },
    ],
  },
  {
    id: "for-scouts",
    headingIcon: Search,
    iconBgClass: "bg-blue-100",
    iconClass: "text-blue-600",
    title: "For Scouts",
    subtitle:
      "Discover and evaluate talent efficiently with advanced search tools, detailed reports, and comprehensive analytics.",
    imageSrc: "/images/feature-scout.jpg",
    imageAlt: "Scout analysing player data",
    imageFirst: true,
    features: [
      { icon: Search, text: "Advanced search & filtering" },
      { icon: BarChart3, text: "Player comparison tools" },
      { icon: Star, text: "Watchlist & tagging system" },
      { icon: TrendingUp, text: "Analytics dashboard" },
      { icon: Clock, text: "Detailed scouting reports" },
    ],
  },
  {
    id: "for-clubs",
    headingIcon: Trophy,
    iconBgClass: "bg-amber-100",
    iconClass: "text-amber-600",
    title: "For Clubs",
    subtitle:
      "Build your dream team with comprehensive roster management, recruitment tracking, and market insights.",
    imageSrc: "/images/feature-team.jpg",
    imageAlt: "Football team in a huddle",
    mobileImageFirst: true,
    features: [
      { icon: Users, text: "Team roster management" },
      { icon: Target, text: "Recruitment pipeline tracking" },
      { icon: TrendingUp, text: "Transfer market insights" },
      { icon: MessageCircle, text: "Communication tools" },
      { icon: BarChart3, text: "Club analytics dashboard" },
    ],
  },
];

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: "1",
    title: "Create Your Profile",
    description:
      "Sign up and build your professional profile with stats, videos, and achievements.",
    icon: Users,
  },
  {
    step: "2",
    title: "Connect & Discover",
    description:
      "Players showcase talent, scouts discover prospects, clubs find their perfect match.",
    icon: Search,
  },
  {
    step: "3",
    title: "Grow Together",
    description:
      "Build relationships, track progress, and take your football career to the next level.",
    icon: TrendingUp,
  },
];

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
] as const;

export const footerLinks = {
  platform: [
    { label: "For Players", href: "#for-players" },
    { label: "For Scouts", href: "#for-scouts" },
    { label: "For Clubs", href: "#for-clubs" },
    { label: "Pricing", href: "#" },
  ],
  company: [
    { label: "About Us", href: "#about" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
} as const;
