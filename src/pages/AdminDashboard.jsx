import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    ShieldCheck, UserCog, User, Video, TrendingUp, Users, Phone,
    Star, Clock, BarChart3, Activity, MessageCircle, Calendar, ArrowUpRight, Loader2, Flag, Trash2, CheckCircle2, BadgeCheck, XCircle
} from 'lucide-react';

// Simple SVG Bar Chart
function BarChart({ data, maxValue, height = 160 }) {
    const barCount = data.length;
    const barWidth = Math.max(20, Math.min(48, 600 / barCount));
    const gap = 4;
    const chartWidth = barCount * (barWidth + gap);

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${Math.max(chartWidth, 300)} ${height + 30}`} className="w-full min-w-[300px]" style={{ maxHeight: height + 40 }}>
                {data.map((item, i) => {
                    const barH = maxValue > 0 ? (item.value / maxValue) * height : 0;
                    const x = i * (barWidth + gap) + gap;
                    const y = height - barH;
                    return (
                        <g key={i}>
                            <rect
                                x={x} y={y} width={barWidth} height={Math.max(barH, 2)}
                                rx="4" ry="4"
                                fill="hsl(var(--primary))"
                                opacity={0.8 + (i % 2) * 0.2}
                            />
                            <text x={x + barWidth / 2} y={height + 14} textAnchor="middle"
                                className="fill-muted-foreground" fontSize="9" fontWeight="500">
                                {item.label}
                            </text>
                            {item.value > 0 && (
                                <text x={x + barWidth / 2} y={y - 4} textAnchor="middle"
                                    className="fill-foreground" fontSize="10" fontWeight="600">
                                    {item.value}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// Donut Chart for session status
function DonutChart({ segments, size = 140 }) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data</p>;

    const cx = size / 2, cy = size / 2, r = size * 0.38, strokeW = size * 0.15;
    let accumulated = 0;

    return (
        <div className="flex flex-col items-center gap-3">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {segments.filter(s => s.value > 0).map((seg, i) => {
                    const pct = seg.value / total;
                    const circumference = 2 * Math.PI * r;
                    const dashLen = pct * circumference;
                    const dashOffset = -accumulated * circumference;
                    accumulated += pct;
                    return (
                        <circle key={i} cx={cx} cy={cy} r={r}
                            fill="none" stroke={seg.color} strokeWidth={strokeW}
                            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                            strokeDashoffset={dashOffset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                        />
                    );
                })}
                <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground" fontSize="20" fontWeight="700">
                    {total}
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
                    Total
                </text>
            </svg>
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                {segments.filter(s => s.value > 0).map((seg, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
                        <span className="text-muted-foreground">{seg.label}: <span className="font-semibold text-foreground">{seg.value}</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Stat Card
function StatCard({ icon: Icon, label, value, sublabel, color, bgColor }) {
    return (
        <Card className={`${bgColor || 'bg-background'} border shadow-sm`}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${color || 'bg-primary/10 text-primary'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
                    {sublabel && <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminDashboard() {
    const { currentUser, userRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [astrologers, setAstrologers] = useState([]);
    const [chats, setChats] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || userRole !== 'superadmin') {
            setLoading(false);
            return;
        }

        async function fetchAllData() {
            try {
                const [usersSnap, sessionsSnap, reviewsSnap, astroSnap, chatsSnap, reportsSnap] = await Promise.all([
                    getDocs(collection(db, 'users')),
                    getDocs(collection(db, 'sessions')),
                    getDocs(collection(db, 'reviews')),
                    getDocs(collection(db, 'astrologers')),
                    getDocs(collection(db, 'chats')),
                    getDocs(collection(db, 'reports')),
                ]);

                const fetchedUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                fetchedUsers.sort((a, b) => {
                    const rank = { user: 1, astrologer: 2, superadmin: 3 };
                    return (rank[a.role] || 0) - (rank[b.role] || 0);
                });
                setUsers(fetchedUsers);
                setSessions(sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setReviews(reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setAstrologers(astroSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setChats(chatsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                const fetchedReports = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                fetchedReports.sort((a, b) => {
                    const aTime = a.createdAt?.toDate?.() || new Date(0);
                    const bTime = b.createdAt?.toDate?.() || new Date(0);
                    return bTime - aTime;
                });
                setReports(fetchedReports);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAllData();
    }, [currentUser, userRole]);

    const promoteToAstrologer = async (userId, userEmail) => {
        try {
            await updateDoc(doc(db, 'users', userId), { role: 'astrologer' });
            await setDoc(doc(db, 'astrologers', userId), {
                name: userEmail.split('@')[0],
                bio: "New astrologer verified by AstroCall Admin.",
                languages: ["English"],
                specializations: [],
                isOnline: false,
                rating: 0,
                reviews: 0,
                hourlyRate: 30
            });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'astrologer' } : u));
        } catch (error) {
            console.error("Error promoting user:", error);
            alert("Failed to promote user. Check permissions.");
        }
    };

    if (userRole !== 'superadmin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4 text-destructive">
                <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="mt-2 text-muted-foreground">You must be a Super Admin to view this page.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // --- Analytics Calculations ---
    const usersCount = users.filter(u => u.role === 'user').length;
    const astrologersCount = users.filter(u => u.role === 'astrologer').length;
    const totalSessions = sessions.length;
    const onlineAstrologers = astrologers.filter(a => a.isOnline).length;

    // Session status breakdown
    const statusCounts = { pending: 0, active: 0, completed: 0, rejected: 0, cancelled: 0 };
    sessions.forEach(s => { if (statusCounts[s.status] !== undefined) statusCounts[s.status]++; });

    // Sessions over last 7 days
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return d;
    });
    const sessionsPerDay = last7Days.map(day => {
        const dayStr = day.toISOString().split('T')[0];
        const count = sessions.filter(s => {
            const sDate = s.startedAt?.toDate?.() || s.createdAt?.toDate?.();
            return sDate && sDate.toISOString().split('T')[0] === dayStr;
        }).length;
        return { label: day.toLocaleDateString('en', { weekday: 'short' }), value: count };
    });
    const maxSessionsPerDay = Math.max(...sessionsPerDay.map(d => d.value), 1);

    // Top astrologers by sessions
    const astroSessionMap = {};
    sessions.forEach(s => {
        if (s.astroId) {
            astroSessionMap[s.astroId] = (astroSessionMap[s.astroId] || 0) + 1;
        }
    });

    // Merge with astrologer data
    const topAstrologers = astrologers
        .map(a => ({
            ...a,
            sessionCount: astroSessionMap[a.id] || 0,
            avgRating: (() => {
                const astroRevs = reviews.filter(r => r.astroId === a.id);
                if (astroRevs.length === 0) return 0;
                return (astroRevs.reduce((s, r) => s + (r.rating || 0), 0) / astroRevs.length).toFixed(1);
            })(),
            reviewCount: reviews.filter(r => r.astroId === a.id).length,
        }))
        .sort((a, b) => b.sessionCount - a.sessionCount)
        .slice(0, 5);

    // Average session duration (for completed sessions with duration data)
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const sessionsWithDuration = completedSessions.filter(s => s.startedAt && s.endedAt);
    const avgMins = sessionsWithDuration.length > 0
        ? Math.round(sessionsWithDuration.reduce((sum, s) => {
            const start = s.startedAt?.toDate?.() || new Date();
            const end = s.endedAt?.toDate?.() || new Date();
            return sum + (end - start) / 60000;
        }, 0) / sessionsWithDuration.length)
        : 0;

    // Call type breakdown
    const videoCount = sessions.filter(s => s.callType === 'video').length;
    const voiceCount = sessions.filter(s => s.callType !== 'video').length;

    return (
        <div className="container py-10 mx-auto px-4 md:px-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                    Admin Analytics Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">Platform overview, user activity, and performance metrics.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                <StatCard icon={Users} label="Total Users" value={usersCount + astrologersCount} color="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" />
                <StatCard icon={User} label="Users" value={usersCount} color="bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400" />
                <StatCard icon={UserCog} label="Astrologers" value={astrologersCount}
                    sublabel={`${onlineAstrologers} online`}
                    color="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400" />
                <StatCard icon={Phone} label="Total Sessions" value={totalSessions} color="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" />
                <StatCard icon={Star} label="Reviews" value={reviews.length} color="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400" />
                <StatCard icon={MessageCircle} label="Conversations" value={chats.length} color="bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400" />
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Sessions Over Time */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" /> Sessions (Last 7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BarChart data={sessionsPerDay} maxValue={maxSessionsPerDay} />
                    </CardContent>
                </Card>

                {/* Session Status Donut */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" /> Session Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center pt-2">
                        <DonutChart segments={[
                            { label: 'Completed', value: statusCounts.completed, color: '#22c55e' },
                            { label: 'Active', value: statusCounts.active, color: '#3b82f6' },
                            { label: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
                            { label: 'Rejected', value: statusCounts.rejected, color: '#ef4444' },
                            { label: 'Cancelled', value: statusCounts.cancelled, color: '#94a3b8' },
                        ]} />
                    </CardContent>
                </Card>
            </div>

            {/* Activity Metrics + Top Astrologers */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Activity Metrics */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" /> Activity Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl border bg-muted/30">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Session Duration</p>
                                <p className="text-xl font-bold text-foreground mt-1">{avgMins > 0 ? `${avgMins} min` : '—'}</p>
                            </div>
                            <div className="p-3 rounded-xl border bg-muted/30">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Completed Sessions</p>
                                <p className="text-xl font-bold text-foreground mt-1">{completedSessions.length}</p>
                            </div>
                            <div className="p-3 rounded-xl border bg-muted/30">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Video Calls</p>
                                <p className="text-xl font-bold text-foreground mt-1">{videoCount}</p>
                            </div>
                            <div className="p-3 rounded-xl border bg-muted/30">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Voice Calls</p>
                                <p className="text-xl font-bold text-foreground mt-1">{voiceCount}</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl border bg-muted/30">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Completion Rate</p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: `${totalSessions > 0 ? (completedSessions.length / totalSessions * 100) : 0}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-foreground">
                                    {totalSessions > 0 ? Math.round(completedSessions.length / totalSessions * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Astrologers */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" /> Top Astrologers
                        </CardTitle>
                        <CardDescription>By number of sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topAstrologers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No astrologer data yet</p>
                        ) : (
                            <div className="space-y-3">
                                {topAstrologers.map((astro, i) => (
                                    <div key={astro.id} className="flex items-center gap-3 p-2.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            i === 1 ? 'bg-slate-100 text-slate-600' :
                                                i === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-muted text-muted-foreground'
                                            }`}>
                                            #{i + 1}
                                        </span>
                                        <Avatar className="w-8 h-8 border">
                                            <AvatarFallback className="text-xs">{(astro.name || '?').charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{astro.name || 'Unknown'}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{astro.sessionCount} sessions</span>
                                                {astro.avgRating > 0 && (
                                                    <span className="flex items-center gap-0.5">
                                                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                                        {astro.avgRating}
                                                    </span>
                                                )}
                                                <span>{astro.reviewCount} reviews</span>
                                            </div>
                                        </div>
                                        <Badge variant={astro.isOnline ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                                            {astro.isOnline ? 'Online' : 'Offline'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* User Management Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">User Management</CardTitle>
                    <CardDescription>Promote users to astrologers or manage roles.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Platform User</th>
                                    <th className="px-6 py-4 font-medium">Current Role</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {users.map(userItem => (
                                    <tr key={userItem.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8 border">
                                                    <AvatarFallback>{userItem.email.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-foreground">{userItem.email}</p>
                                                    <p className="text-xs text-muted-foreground">ID: {userItem.id.substring(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={
                                                userItem.role === 'superadmin' ? 'destructive' :
                                                    userItem.role === 'astrologer' ? 'default' : 'secondary'
                                            }>
                                                {userItem.role}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {userItem.role === 'user' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => promoteToAstrologer(userItem.id, userItem.email)}
                                                    className="shadow-sm"
                                                >
                                                    <TrendingUp className="w-4 h-4 mr-2" />
                                                    Promote to Astrologer
                                                </Button>
                                            )}
                                            {userItem.role === 'astrologer' && (
                                                <Button
                                                    size="sm"
                                                    variant={astrologers.find(a => a.id === userItem.id)?.verified ? 'outline' : 'default'}
                                                    className={`shadow-sm gap-1 ${astrologers.find(a => a.id === userItem.id)?.verified ? 'border-green-300 text-green-700 hover:bg-green-50' : ''}`}
                                                    onClick={async () => {
                                                        const astro = astrologers.find(a => a.id === userItem.id);
                                                        const newVerified = !astro?.verified;
                                                        try {
                                                            await updateDoc(doc(db, 'astrologers', userItem.id), { verified: newVerified });
                                                            setAstrologers(prev => prev.map(a => a.id === userItem.id ? { ...a, verified: newVerified } : a));
                                                        } catch (err) {
                                                            console.error('Error toggling verification:', err);
                                                        }
                                                    }}
                                                >
                                                    {astrologers.find(a => a.id === userItem.id)?.verified ? (
                                                        <><CheckCircle2 className="w-4 h-4" /> Verified</>
                                                    ) : (
                                                        <><BadgeCheck className="w-4 h-4" /> Verify</>
                                                    )}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Content Moderation */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Flag className="w-4 h-4 text-red-500" /> Content Moderation
                    </CardTitle>
                    <CardDescription>
                        Review flagged content reported by users. {reports.filter(r => r.status === 'pending').length} pending reports.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {reports.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Flag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">No reports yet</p>
                            <p className="text-xs mt-1">Flagged reviews and messages will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map(report => (
                                <div key={report.id} className={`p-4 rounded-xl border transition-colors ${report.status === 'pending'
                                    ? 'bg-red-50/50 border-red-200 dark:bg-red-500/5 dark:border-red-500/20'
                                    : report.status === 'dismissed'
                                        ? 'bg-muted/30 border-muted opacity-60'
                                        : 'bg-green-50/50 border-green-200 dark:bg-green-500/5 dark:border-green-500/20'
                                    }`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'} className="text-[10px]">
                                                    {report.status === 'pending' ? '⚠ Pending' : report.status === 'dismissed' ? '✓ Dismissed' : '🗑 Deleted'}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {report.type === 'review' ? '📝 Review' : '💬 Message'}
                                                </Badge>
                                                {report.rating && (
                                                    <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                                                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                                        {report.rating}/5
                                                    </span>
                                                )}
                                            </div>
                                            {report.content && (
                                                <p className="text-sm text-foreground bg-background/80 p-2.5 rounded-lg border mt-2 leading-relaxed">
                                                    "{report.content}"
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                                                <span>By: <span className="font-medium text-foreground">{report.reportedUserEmail || 'Unknown'}</span></span>
                                                <span>Reported by: <span className="font-medium text-foreground">{report.reportedByEmail}</span></span>
                                                <span>
                                                    {report.createdAt?.toDate
                                                        ? new Date(report.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                        : 'Recent'}
                                                </span>
                                            </div>
                                        </div>
                                        {report.status === 'pending' && (
                                            <div className="flex gap-1.5 shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs gap-1"
                                                    onClick={async () => {
                                                        try {
                                                            await updateDoc(doc(db, 'reports', report.id), { status: 'dismissed' });
                                                            setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'dismissed' } : r));
                                                        } catch (err) {
                                                            console.error('Error dismissing report:', err);
                                                        }
                                                    }}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Dismiss
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-8 text-xs gap-1"
                                                    onClick={async () => {
                                                        try {
                                                            // Delete the reported review
                                                            if (report.contentId) {
                                                                await deleteDoc(doc(db, 'reviews', report.contentId));
                                                            }
                                                            await updateDoc(doc(db, 'reports', report.id), { status: 'deleted' });
                                                            setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'deleted' } : r));
                                                        } catch (err) {
                                                            console.error('Error deleting content:', err);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
