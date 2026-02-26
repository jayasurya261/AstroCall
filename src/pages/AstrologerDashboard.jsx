import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, PhoneCall, Calendar, Video, Phone, Check, X, Power, DollarSign, Camera, Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function AstrologerDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
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

    // Fetch online status from astrologers collection
    async function fetchOnlineStatus() {
        if (!currentUser) return;
        try {
            const astroRef = doc(db, 'astrologers', currentUser.uid);
            const astroSnap = await getDoc(astroRef);
            if (astroSnap.exists()) {
                setIsOnline(astroSnap.data().isOnline || false);
                const rate = astroSnap.data().hourlyRate || 30;
                setHourlyRate(rate);
                setRateInput(String(rate));
                setPhotoURL(astroSnap.data().photoURL || '');
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

    useEffect(() => {
        fetchOnlineStatus();
        fetchSessions();
        fetchMyReviews();
    }, [currentUser]);

    // Accept a session
    async function handleAccept(sessionId) {
        setActionLoading(sessionId + '-accept');
        try {
            await updateDoc(doc(db, 'sessions', sessionId), { status: 'active' });

            const session = sessions.find(s => s.id === sessionId);

            toast('Session accepted! Joining call...', {
                style: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
            });

            if (session?.roomName) {
                navigate(`/call-room?room=${session.roomName}&type=${session.callType}`);
            } else {
                await fetchSessions();
            }
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
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
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
                                <Camera className="w-5 h-5 text-white" />
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
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Astrologer Dashboard</h1>
                        <p className="text-muted-foreground mt-2">Manage your consultations and availability.</p>
                    </div>
                </div>

                {/* Online/Offline Toggle + Hourly Rate */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Rate Editor */}
                    <div className="flex items-center gap-1.5 border rounded-lg px-3 py-1.5 bg-background">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
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
                                {savingRate ? '...' : 'Save'}
                            </Button>
                        )}
                    </div>

                    <Button
                        onClick={toggleOnlineStatus}
                        disabled={togglingStatus}
                        variant={isOnline ? "default" : "outline"}
                        className={`gap-2 min-w-[140px] transition-all ${isOnline
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Power className="w-4 h-4" />
                        {togglingStatus ? 'Updating...' : isOnline ? 'Online' : 'Offline'}
                    </Button>
                    <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
                        <p className="text-xs text-yellow-600 font-medium">Pending</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-700">{activeCount}</p>
                        <p className="text-xs text-green-600 font-medium">Active</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-700">{todaysCalls}</p>
                        <p className="text-xs text-blue-600 font-medium">Today's Calls</p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
                        <p className="text-xs text-muted-foreground font-medium">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-700 flex items-center justify-center gap-1">
                            <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                            {avgRating || '—'}
                        </p>
                        <p className="text-xs text-yellow-600 font-medium">{myReviews.length} Reviews</p>
                    </CardContent>
                </Card>
            </div>

            {/* Sessions list */}
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
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground">No bookings yet</h3>
                    <p className="text-muted-foreground mt-1">
                        {isOnline ? 'You are online. Users can book consultations with you.' : 'Go online to start receiving bookings.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {sessions.map(session => (
                        <Card key={session.id} className={`overflow-hidden ${session.status === 'pending' ? 'border-yellow-300 shadow-sm shadow-yellow-100' : ''}`}>
                            <CardContent className="p-0 sm:flex items-center">
                                <div className="p-6 flex-1">
                                    <div className="flex items-center justify-between mb-4 sm:mb-2 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={getStatusColor(session.status)}>
                                                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                            </Badge>
                                            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                                {session.callType === 'video' ? (
                                                    <><Video className="w-3 h-3" /> Video Call</>
                                                ) : (
                                                    <><Phone className="w-3 h-3" /> Voice Call</>
                                                )}
                                            </Badge>
                                        </div>
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {session.startedAt ? new Date(session.startedAt.toDate()).toLocaleDateString() : 'Pending'}
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

                                {/* PENDING → Show Accept / Reject */}
                                {session.status === 'pending' && (
                                    <div className="bg-yellow-50/50 p-6 sm:border-l flex flex-col items-center justify-center gap-3">
                                        <Button
                                            onClick={() => handleAccept(session.id)}
                                            disabled={!!actionLoading}
                                            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Check className="w-4 h-4" />
                                            {actionLoading === session.id + '-accept' ? 'Accepting...' : 'Accept'}
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(session.id)}
                                            disabled={!!actionLoading}
                                            variant="outline"
                                            className="w-full gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                            {actionLoading === session.id + '-reject' ? 'Rejecting...' : 'Reject'}
                                        </Button>
                                    </div>
                                )}

                                {/* ACTIVE → Show Join Call */}
                                {session.status === 'active' && (
                                    <div className="bg-primary/5 p-6 sm:border-l flex items-center justify-center">
                                        <Button
                                            onClick={() => navigate(`/call-room?room=${session.roomName}&type=${session.callType}`)}
                                            className="gap-2"
                                        >
                                            {session.callType === 'video' ? (
                                                <><Video className="w-4 h-4" /> Join Video Call</>
                                            ) : (
                                                <><PhoneCall className="w-4 h-4" /> Join Voice Call</>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* My Reviews Section */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-yellow-600" />
                    My Reviews
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">Feedback from your clients.</p>

                {reviewsLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="h-20 bg-muted/50"></CardContent>
                            </Card>
                        ))}
                    </div>
                ) : myReviews.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                        <Star className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-40" />
                        <h3 className="text-base font-medium text-foreground">No reviews yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">Reviews from your clients will appear here.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {myReviews.map(review => (
                            <Card key={review.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-9 h-9 border">
                                                <AvatarFallback className="text-xs">
                                                    {(review.userEmail || 'U').charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm text-foreground">{review.userEmail}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {review.createdAt?.toDate
                                                        ? new Date(review.createdAt.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : 'Recent'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed pl-12">
                                            "{review.comment}"
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
