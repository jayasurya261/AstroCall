import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Icons removed for clean text-only UI
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function AstrologerDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);
    const [hourlyRate, setHourlyRate] = useState(30);
    const [rateInput, setRateInput] = useState('30');
    const [savingRate, setSavingRate] = useState(false);
    const [photoURL, setPhotoURL] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = React.useRef(null);
    const [myReviews, setMyReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [myChats, setMyChats] = useState([]);
    const [astroLanguages, setAstroLanguages] = useState([]);
    const [savingLangs, setSavingLangs] = useState(false);
    const [astroSpecializations, setAstroSpecializations] = useState([]);
    const [savingSpecs, setSavingSpecs] = useState(false);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'accepted', 'rejected'

    // Fetch online status from astrologers collection
    async function fetchOnlineStatus() {
        if (!currentUser) return;
        try {
            const astroRef = doc(db, 'astrologers', currentUser.uid);
            const astroSnap = await getDoc(astroRef);
            if (astroSnap.exists()) {
                const data = astroSnap.data();

                let fetchedPhotoURL = data.photoURL || '';
                // Auto-sync Google Profile Image (Gmail image) if missing in DB
                if (!fetchedPhotoURL && currentUser.photoURL) {
                    fetchedPhotoURL = currentUser.photoURL;
                    await updateDoc(astroRef, { photoURL: fetchedPhotoURL });
                }

                setIsOnline(data.isOnline || false);
                const rate = data.hourlyRate || 30;
                setHourlyRate(rate);
                setRateInput(String(rate));
                setPhotoURL(fetchedPhotoURL);
                setAstroLanguages(data.languages || []);
                setAstroSpecializations(data.specializations || []);
            }
        } catch (err) {
            console.error("Error fetching online status:", err);
        }
    }

    // Toggle online/offline
    async function toggleOnlineStatus() {
        setTogglingStatus(true);
        try {
            const newStatus = !isOnline;
            await updateDoc(doc(db, 'astrologers', currentUser.uid), { isOnline: newStatus });
            setIsOnline(newStatus);
            toast(newStatus ? "You're now Online!" : "You're now Offline", {
                description: newStatus ? 'Users can now book sessions with you.' : 'Users cannot book sessions while you are offline.',
                style: newStatus
                    ? { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }
                    : { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
            });
        } catch (err) {
            console.error("Error toggling status:", err);
            toast('Failed to update status', {
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
        } finally {
            setTogglingStatus(false);
        }
    }

    // Save hourly rate
    async function saveHourlyRate() {
        const rate = parseFloat(rateInput);
        if (isNaN(rate) || rate < 0) {
            toast('Enter a valid rate', { style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' } });
            return;
        }
        setSavingRate(true);
        try {
            await updateDoc(doc(db, 'astrologers', currentUser.uid), { hourlyRate: rate });
            setHourlyRate(rate);
            toast('Hourly rate updated!', {
                description: `Your rate is now $${rate}/hr`,
                style: { background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' },
            });
        } catch (err) {
            console.error("Error saving rate:", err);
            toast('Failed to update rate', { style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' } });
        } finally {
            setSavingRate(false);
        }
    }

    async function fetchSessions() {
        if (!currentUser) return;
        try {
            const q = query(
                collection(db, 'sessions'),
                where('astroId', '==', currentUser.uid)
            );

            const querySnapshot = await getDocs(q);

            const sessionsWithUserData = await Promise.all(
                querySnapshot.docs.map(async (sessionDoc) => {
                    const sessionData = sessionDoc.data();

                    let userEmail = 'Unknown User';
                    if (sessionData.userId) {
                        try {
                            const userRef = doc(db, 'users', sessionData.userId);
                            const userSnap = await getDoc(userRef);
                            if (userSnap.exists()) {
                                userEmail = userSnap.data().email;
                            }
                        } catch (e) {
                            console.error("Error fetching user data:", e);
                        }
                    }

                    return {
                        id: sessionDoc.id,
                        userEmail: userEmail,
                        ...sessionData
                    };
                })
            );

            sessionsWithUserData.sort((a, b) => {
                const priority = { pending: 0, active: 1, completed: 2, rejected: 3, cancelled: 4 };
                const pA = priority[a.status] ?? 5;
                const pB = priority[b.status] ?? 5;
                if (pA !== pB) return pA - pB;
                const aTime = a.startedAt?.toDate?.() || new Date(0);
                const bTime = b.startedAt?.toDate?.() || new Date(0);
                return bTime - aTime;
            });

            setSessions(sessionsWithUserData);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    }

    // Fetch reviews for this astrologer
    async function fetchMyReviews() {
        if (!currentUser) return;
        setReviewsLoading(true);
        try {
            const q = query(
                collection(db, 'reviews'),
                where('astroId', '==', currentUser.uid)
            );
            const snap = await getDocs(q);
            const revs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort newest first
            revs.sort((a, b) => {
                const aTime = a.createdAt?.toDate?.() || new Date(0);
                const bTime = b.createdAt?.toDate?.() || new Date(0);
                return bTime - aTime;
            });
            setMyReviews(revs);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setReviewsLoading(false);
        }
    }

    // Fetch chats for this astrologer
    async function fetchMyChats() {
        if (!currentUser) return;
        try {
            const q = query(
                collection(db, 'chats'),
                where('astroId', '==', currentUser.uid)
            );
            const snap = await getDocs(q);
            const chatList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            chatList.sort((a, b) => {
                const aTime = a.lastMessageAt?.toDate?.() || new Date(0);
                const bTime = b.lastMessageAt?.toDate?.() || new Date(0);
                return bTime - aTime;
            });
            setMyChats(chatList);
        } catch (err) {
            console.error('Error fetching chats:', err);
        }
    }

    useEffect(() => {
        fetchOnlineStatus();
        fetchSessions();
        fetchMyReviews();
        fetchMyChats();
    }, [currentUser]);

    // Accept a session
    async function handleAccept(sessionId) {
        setActionLoading(sessionId + '-accept');
        try {
            await updateDoc(doc(db, 'sessions', sessionId), { status: 'active' });

            toast('Session accepted! Click "Join Call" when you are ready.', {
                style: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
            });

            await fetchSessions();
        } catch (err) {
            console.error("Error accepting session:", err);
            toast('Failed to accept session', {
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
        } finally {
            setActionLoading(null);
        }
    }

    // Reject a session
    async function handleReject(sessionId) {
        setActionLoading(sessionId + '-reject');
        try {
            await updateDoc(doc(db, 'sessions', sessionId), { status: 'rejected' });
            toast('Session rejected.', {
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
            await fetchSessions();
        } catch (err) {
            console.error("Error rejecting session:", err);
        } finally {
            setActionLoading(null);
        }
    }

    const getStatusColor = (status) => {
        return 'bg-muted text-foreground border-border';
    };

    const pendingCount = sessions.filter(s => s.status === 'pending').length;
    const activeCount = sessions.filter(s => s.status === 'active').length;

    // Compute average rating from reviews
    const avgRating = myReviews.length > 0
        ? Math.round((myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length) * 10) / 10
        : 0;

    // Today's calls
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysCalls = sessions.filter(s => {
        if (!s.startedAt?.toDate) return false;
        const d = s.startedAt.toDate();
        return d >= today && (s.status === 'active' || s.status === 'completed');
    }).length;

    return (
        <div className="container py-10 mx-auto px-4 md:px-8">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Clickable Avatar for Photo Upload */}
                    <div
                        className="relative cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Avatar className="w-16 h-16 border-2 border-primary/20">
                            <AvatarImage src={photoURL} />
                            <AvatarFallback className="text-lg">{currentUser?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {uploadingPhoto ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <span className="text-white text-xs font-bold">Edit</span>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingPhoto(true);
                                try {
                                    // Resize & compress to base64 (max 200x200)
                                    const base64 = await new Promise((resolve, reject) => {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            const img = new Image();
                                            img.onload = () => {
                                                const canvas = document.createElement('canvas');
                                                const MAX = 200;
                                                let w = img.width, h = img.height;
                                                if (w > h) { h = (h / w) * MAX; w = MAX; }
                                                else { w = (w / h) * MAX; h = MAX; }
                                                canvas.width = w;
                                                canvas.height = h;
                                                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                                                resolve(canvas.toDataURL('image/jpeg', 0.7));
                                            };
                                            img.onerror = reject;
                                            img.src = ev.target.result;
                                        };
                                        reader.onerror = reject;
                                        reader.readAsDataURL(file);
                                    });
                                    await updateDoc(doc(db, 'astrologers', currentUser.uid), { photoURL: base64 });
                                    setPhotoURL(base64);
                                    toast('Profile photo updated!', {
                                        style: { background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' },
                                    });
                                } catch (err) {
                                    console.error('Photo upload error:', err);
                                    toast('Failed to upload photo', {
                                        style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
                                    });
                                } finally {
                                    setUploadingPhoto(false);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('nav.dashboard')}</h1>
                        <p className="text-muted-foreground mt-2">{t('dashboard.todaySessions')}</p>
                    </div>
                </div>

                {/* Online/Offline Toggle + Hourly Rate */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Rate Editor */}
                    <div className="flex items-center gap-1.5 border rounded-lg px-3 py-1.5 bg-background">
                        <span className="text-sm font-bold text-muted-foreground">$</span>
                        <Input
                            type="number"
                            min="0"
                            value={rateInput}
                            onChange={(e) => setRateInput(e.target.value)}
                            className="w-16 h-7 text-sm p-1 border-0 focus-visible:ring-0"
                        />
                        <span className="text-xs text-muted-foreground">/hr</span>
                        {rateInput !== String(hourlyRate) && (
                            <Button
                                size="sm"
                                onClick={saveHourlyRate}
                                disabled={savingRate}
                                className="h-7 px-2 text-xs"
                            >
                                {savingRate ? '...' : t('dashboard.saveRate')}
                            </Button>
                        )}
                    </div>

                    <Button
                        onClick={toggleOnlineStatus}
                        disabled={togglingStatus}
                        variant={isOnline ? "default" : "outline"}
                        className={`gap-2 min-w-[140px] transition-all font-bold ${isOnline
                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                            : 'border-border text-foreground hover:bg-muted'
                            }`}
                    >
                        {togglingStatus ? '...' : isOnline ? t('astrologers.online') : t('astrologers.offline')}
                    </Button>
                </div>
            </div>

            {/* Language Selector */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-bold text-foreground">Languages You Speak</h3>
                    {savingLangs && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                    {['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Odia'].map(lang => {
                        const isSelected = astroLanguages.includes(lang);
                        return (
                            <button
                                key={lang}
                                onClick={async () => {
                                    const updated = isSelected
                                        ? astroLanguages.filter(l => l !== lang)
                                        : [...astroLanguages, lang];
                                    setAstroLanguages(updated);
                                    setSavingLangs(true);
                                    try {
                                        await updateDoc(doc(db, 'astrologers', currentUser.uid), { languages: updated });
                                    } catch (err) {
                                        console.error('Error saving languages:', err);
                                    } finally {
                                        setSavingLangs(false);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isSelected
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                                    }`}
                            >
                                {isSelected && <span className="inline mr-1">✓</span>}
                                {lang}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Specializations Selector */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-bold text-foreground">Your Specializations</h3>
                    {savingSpecs && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                    {['Vedic Astrology', 'Tarot Reading', 'Numerology', 'Palmistry', 'Vastu', 'Face Reading', 'KP Astrology', 'Nadi Astrology', 'Prashna Kundli'].map(spec => {
                        const isSelected = astroSpecializations.includes(spec);
                        return (
                            <button
                                key={spec}
                                onClick={async () => {
                                    const updated = isSelected
                                        ? astroSpecializations.filter(s => s !== spec)
                                        : [...astroSpecializations, spec];
                                    setAstroSpecializations(updated);
                                    setSavingSpecs(true);
                                    try {
                                        await updateDoc(doc(db, 'astrologers', currentUser.uid), { specializations: updated });
                                    } catch (err) {
                                        console.error('Error saving specializations:', err);
                                    } finally {
                                        setSavingSpecs(false);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isSelected
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                                    }`}
                            >
                                {isSelected && <span className="inline mr-1">✓</span>}
                                {spec}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                <Card className="border-border">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                        <p className="text-xs text-muted-foreground font-medium">{t('dashboard.pendingCalls')}</p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                        <p className="text-xs text-muted-foreground font-medium">{t('dashboard.activeCalls')}</p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{todaysCalls}</p>
                        <p className="text-xs text-muted-foreground font-medium">{t('dashboard.todaySessions')}</p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
                        <p className="text-xs text-muted-foreground font-medium">{t('profile.sessions')}</p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">
                            {avgRating || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">{myReviews.length} {t('profile.reviews')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Sessions - Tabs Layout */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="h-24 bg-muted/50"></CardHeader>
                        </Card>
                    ))}
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                    <h3 className="text-lg font-medium text-foreground">{t('dashboard.noSessions')}</h3>
                    <p className="text-muted-foreground mt-1">
                        {isOnline ? t('dashboard.todaySessions') : t('dashboard.goOnline')}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Tabs Navigation */}
                    <div className="flex items-center gap-2 border-b border-border pb-4 overflow-x-auto">
                        <Button
                            variant={activeTab === 'pending' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('pending')}
                            className="font-bold relative"
                        >
                            Pending
                            <Badge variant="secondary" className="ml-2 text-xs">
                                {sessions.filter(s => s.status === 'pending').length}
                            </Badge>
                        </Button>
                        <Button
                            variant={activeTab === 'accepted' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('accepted')}
                            className="font-bold relative"
                        >
                            Accepted
                            <Badge variant="secondary" className="ml-2 text-xs">
                                {sessions.filter(s => s.status === 'active' || s.status === 'completed').length}
                            </Badge>
                        </Button>
                        <Button
                            variant={activeTab === 'rejected' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('rejected')}
                            className="font-bold relative"
                        >
                            Rejected
                            <Badge variant="secondary" className="ml-2 text-xs">
                                {sessions.filter(s => s.status === 'rejected' || s.status === 'cancelled').length}
                            </Badge>
                        </Button>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-4">
                        {/* === PENDING === */}
                        {activeTab === 'pending' && (
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-1">Pending</h2>
                                <p className="text-sm text-muted-foreground mb-4">Sessions waiting for your response</p>
                                {sessions.filter(s => s.status === 'pending').length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-lg border border-dashed">No pending sessions</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {sessions.filter(s => s.status === 'pending').map(session => (
                                            <Card key={session.id} className="overflow-hidden border-border shadow-sm">
                                                <CardContent className="p-0 sm:flex items-center">
                                                    <div className="p-6 flex-1">
                                                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {session.callType === 'video' ? t('astrologers.videoCall') : t('astrologers.voiceCall')}
                                                            </Badge>
                                                            <span className="text-sm text-muted-foreground">
                                                                {session.startedAt ? new Date(session.startedAt.toDate()).toLocaleDateString() : 'Just now'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-4">
                                                            <Avatar className="w-12 h-12 border">
                                                                <AvatarFallback>{session.userEmail.charAt(0).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-foreground">{session.userEmail}</p>
                                                                <p className="text-sm text-muted-foreground">Session: {session.id.substring(0, 8)}...</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-muted/30 p-6 sm:border-l flex flex-col items-center justify-center gap-3">
                                                        <Button
                                                            onClick={() => handleAccept(session.id)}
                                                            disabled={!!actionLoading}
                                                            className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                                                        >
                                                            {actionLoading === session.id + '-accept' ? '...' : t('dashboard.accept')}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleReject(session.id)}
                                                            disabled={!!actionLoading}
                                                            variant="outline"
                                                            className="w-full font-bold border-border text-foreground hover:bg-muted"
                                                        >
                                                            {actionLoading === session.id + '-reject' ? '...' : t('dashboard.reject')}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === ACCEPTED === */}
                        {activeTab === 'accepted' && (
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-1">Accepted</h2>
                                <p className="text-sm text-muted-foreground mb-4">Active and completed sessions</p>
                                {sessions.filter(s => s.status === 'active' || s.status === 'completed').length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-lg border border-dashed">No accepted sessions</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {sessions.filter(s => s.status === 'active' || s.status === 'completed').map(session => (
                                            <Card key={session.id} className="overflow-hidden border-border">
                                                <CardContent className="p-0 sm:flex items-center">
                                                    <div className="p-6 flex-1">
                                                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className={getStatusColor(session.status)}>
                                                                    {session.status === 'active' ? 'Active' : 'Completed'}
                                                                </Badge>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {session.callType === 'video' ? t('astrologers.videoCall') : t('astrologers.voiceCall')}
                                                                </Badge>
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">
                                                                {session.startedAt ? new Date(session.startedAt.toDate()).toLocaleDateString() : '—'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-4">
                                                            <Avatar className="w-12 h-12 border">
                                                                <AvatarFallback>{session.userEmail.charAt(0).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-foreground">{session.userEmail}</p>
                                                                <p className="text-sm text-muted-foreground">Session: {session.id.substring(0, 8)}...</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {session.status === 'active' && (
                                                        <div className="bg-muted/30 p-6 sm:border-l flex items-center justify-center">
                                                            <Button
                                                                onClick={() => navigate(`/call-room?room=${session.roomName}&type=${session.callType}`)}
                                                                className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                                                            >
                                                                {t('dashboard.joinCall')}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === REJECTED === */}
                        {activeTab === 'rejected' && (
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-1">Rejected</h2>
                                <p className="text-sm text-muted-foreground mb-4">Sessions you declined</p>
                                {sessions.filter(s => s.status === 'rejected' || s.status === 'cancelled').length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-lg border border-dashed">No rejected sessions</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {sessions.filter(s => s.status === 'rejected' || s.status === 'cancelled').map(session => (
                                            <Card key={session.id} className="overflow-hidden border-border opacity-75">
                                                <CardContent className="p-6">
                                                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className={getStatusColor(session.status)}>
                                                                {session.status === 'rejected' ? 'Rejected' : 'Cancelled'}
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {session.callType === 'video' ? t('astrologers.videoCall') : t('astrologers.voiceCall')}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">
                                                            {session.startedAt ? new Date(session.startedAt.toDate()).toLocaleDateString() : '—'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-4">
                                                        <Avatar className="w-12 h-12 border">
                                                            <AvatarFallback>{session.userEmail.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-foreground">{session.userEmail}</p>
                                                            <p className="text-sm text-muted-foreground">Session: {session.id.substring(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* My Reviews - Link to dedicated page */}
            <Card className="mt-8 overflow-hidden hover:shadow-md transition-shadow border-border">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                My Reviews
                                {myReviews.length > 0 && (
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {avgRating}/5 · {myReviews.length} {t('profile.reviews')}
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-muted-foreground">View all feedback from your clients</p>
                        </div>
                        <Button asChild variant="outline" className="font-bold border-border text-foreground hover:bg-muted">
                            <Link to="/astrologer-reviews">
                                View All
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Messages - All client conversations */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-2">
                    {t('dashboard.clientMessages')}
                    {myChats.length > 0 && (
                        <Badge variant="secondary" className="text-xs ml-2">
                            {myChats.length}
                        </Badge>
                    )}
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">{t('dashboard.clickToChat')}</p>

                {myChats.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">

                        <h3 className="text-base font-medium text-foreground">{t('dashboard.noMessages')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t('dashboard.messagesWillAppear')}</p>
                    </div>
                ) : (
                    <div className="grid gap-2 max-h-[500px] overflow-y-auto pr-1">
                        {myChats.map(chat => (
                            <Link
                                key={chat.id}
                                to={`/chat?id=${chat.id}`}
                                className="flex items-center gap-4 p-4 rounded-xl bg-background border hover:border-border hover:shadow-sm transition-all group"
                            >
                                <Avatar className="w-10 h-10 border shrink-0">
                                    <AvatarFallback className="text-sm bg-muted text-foreground">
                                        {(chat.userName || chat.userEmail || 'U').charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-sm text-foreground transition-colors truncate">
                                            {chat.userName || chat.userEmail?.split('@')[0] || 'User'}
                                        </p>
                                        <span className="text-[11px] text-muted-foreground shrink-0 ml-3">
                                            {chat.lastMessageAt?.toDate
                                                ? new Date(chat.lastMessageAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                                                : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <p className="text-xs text-muted-foreground truncate">
                                            {chat.lastMessage || t('chat.noMessages')}
                                        </p>
                                        <span className="text-xs text-muted-foreground shrink-0 ml-3">
                                            {chat.userEmail}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
