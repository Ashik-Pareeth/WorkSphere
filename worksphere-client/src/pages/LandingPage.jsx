import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
    Briefcase,
    CalendarCheck,
    Users,
    LineChart,
    ArrowRight,
    CheckCircle2,
    Shield,
    Globe
} from 'lucide-react';

export default function LandingPage() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-dm overflow-hidden selection:bg-blue-500/30">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay noise" />
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)',
                    backgroundSize: '72px 72px',
                }}
            />

            {/* Navigation Bar */}
            <nav className="relative z-10 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Shield className="w-6 h-6 text-white" strokeWidth={2} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white font-sora">
                                WorkSphere
                            </span>
                        </div>
                        <div className="flex items-center gap-6">
                            <Link to="/careers" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                Careers
                            </Link>
                            <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                                <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)] rounded-full px-6">
                                    {isAuthenticated ? "Go to Dashboard" : "Access Portal"}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 animate-[fadeIn_0.5s_ease-out]">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        Next-Gen HR Operating System
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 font-sora animate-[fadeIn_0.7s_ease-out]">
                        The Modern <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            Workplace OS
                        </span>
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12 animate-[fadeIn_0.9s_ease-out]">
                        Unify your HR, payroll, performance, and recruitment into one seamless, beautifully designed platform built for modern teams.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeIn_1.1s_ease-out]">
                        <Link to={isAuthenticated ? "/dashboard" : "/login"} className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-14 px-8 text-base bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1">
                                {isAuthenticated ? "Open Dashboard" : "Sign In to Portal"} <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link to="/careers" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto h-14 px-8 text-base bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl transition-all">
                                View Open Roles
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="bg-slate-900/40 border-y border-white/5 py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-white font-sora mb-4">Everything you need to scale</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">WorkSphere replaces dozens of fragmented tools with a single, deeply integrated platform.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    icon: Briefcase,
                                    title: "Recruitment Hub",
                                    desc: "Track applicants, schedule interviews, and finalize hires in a simple Kanban board."
                                },
                                {
                                    icon: CalendarCheck,
                                    title: "Leave Management",
                                    desc: "Manage policies, track balances, and approve time-off requests seamlessly."
                                },
                                {
                                    icon: Users,
                                    title: "Performance",
                                    desc: "Conduct 360 appraisals, track goals, and monitor team productivity metrics."
                                },
                                {
                                    icon: LineChart,
                                    title: "Payroll & Comp",
                                    desc: "Automate salary calculations, manage benefits, and generate pay slips instantly."
                                }
                            ].map((feature, i) => (
                                <div key={i} className="bg-slate-800/40 border border-white/5 p-8 rounded-2xl hover:bg-slate-800/60 transition-colors group">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <feature.icon className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Statistics / Social Proof */}
                <div className="py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/5">
                            {[
                                { label: "Enterprise Clients", value: "500+" },
                                { label: "Employees Managed", value: "2M+" },
                                { label: "Platform Uptime", value: "99.9%" },
                                { label: "Global Presence", value: "120+" }
                            ].map((stat, i) => (
                                <div key={i} className="flex flex-col items-center justify-center">
                                    <span className="text-4xl md:text-5xl font-bold text-white font-sora mb-2">{stat.value}</span>
                                    <span className="text-sm text-slate-400">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-slate-900/80 pt-16 pb-8 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="w-5 h-5 text-blue-500" />
                                <span className="text-lg font-bold text-white font-sora">WorkSphere</span>
                            </div>
                            <p className="text-sm text-slate-400 max-w-xs">
                                Powering the modern workforce with intelligent, seamless tools.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                                <li><Link to="/careers" className="hover:text-blue-400 transition-colors">Careers</Link></li>
                                <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
                        <p>© {new Date().getFullYear()} WorkSphere Inc. All rights reserved.</p>
                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                            <Globe className="w-4 h-4" />
                            <span>English (US)</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
