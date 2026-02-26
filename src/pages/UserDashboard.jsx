import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, PhoneCall, Calendar, Video, Phone, Star, MessageSquare, Loader2, CheckCircle2, MessageCircle, Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function UserDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Review state
    const [reviewedSessionIds, setReviewedSessionIds] = useState(new Set());
    const [reviewFormOpen, setReviewFormOpen] = useState(null); // sessionId or null
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewHover, setReviewHover] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [myChats, setMyChats] = useState([]);
    const [favorites, setFavorites] = useState([]); // { favDocId, astroId, ...astroData }
    const [togglingFav, setTogglingFav] = useState(null);

    useEffect(() => {
        if (!currentUser) return;

        async function fetchSessions() {
            try {
                const q = query(
                    collection(db, 'sessions'),
                    where('userId', '==', currentUser.uid)
                );

                const querySnapshot = await getDocs(q);

                const sessionsWithAstroData = await Promise.all(
                    querySnapshot.docs.map(async (sessionDoc) => {
                        const sessionData = sessionDoc.data();

                        let astroName = 'Unknown Astrologer';
                        if (sessionData.astroId) {
                            try {
                                const astroRef = doc(db, 'astrologers', sessionData.astroId);
                                const astroSnap = await getDoc(astroRef);
                                if (astroSnap.exists()) {
                                    astroName = astroSnap.data().name;
                                } else {
                                    const userRef = doc(db, 'users', sessionData.astroId);
                                    const userSnap = await getDoc(userRef);
                                    if (userSnap.exists()) {
                                        astroName = userSnap.data().email.split('@')[0];
                                    }
                                }
                            } catch (e) {
                                console.error("Error fetching astrologer data:", e);
                            }
                        }

                        return {
                            id: sessionDoc.id,
                            astroName: astroName,
                            ...sessionData
                        };
                    })
                );

                // Sort client-side: newest first
                sessionsWithAstroData.sort((a, b) => {
                    const aTime = a.startedAt?.toDate?.() || new Date(0);
                    const bTime = b.startedAt?.toDate?.() || new Date(0);
                    return bTime - aTime;
                });

                setSessions(sessionsWithAstroData);

                // Fetch which sessions user already reviewed
                const reviewsQuery = query(
                    collection(db, 'reviews'),
                    where('userId', '==', currentUser.uid)
                );
                const reviewsSnap = await getDocs(reviewsQuery);
                const reviewedIds = new Set();
                reviewsSnap.docs.forEach(d => reviewedIds.add(d.data().sessionId));
                setReviewedSessionIds(reviewedIds);
            } catch (error) {
                console.error("Error fetching sessions:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSessions();

        // Fetch user's chats
        async function fetchChats() {
            try {
                const q = query(
                    collection(db, 'chats'),
                    where('userId', '==', currentUser.uid)
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
        fetchChats();

        // Fetch favorites
        async function fetchFavorites() {
            try {
                const q = query(
                    collection(db, 'favorites'),
                    where('userId', '==', currentUser.uid)
                );
                const snap = await getDocs(q);
                const favs = await Promise.all(
                    snap.docs.map(async (d) => {
                        const data = d.data();
                        let astroData = {};
                        try {
                            const astroSnap = await getDoc(doc(db, 'astrologers', data.astroId));
                            if (astroSnap.exists()) astroData = astroSnap.data();
                        } catch (e) { /* ignore */ }
                        return { favDocId: d.id, astroId: data.astroId, ...astroData };
                    })
                );
                setFavorites(favs);
            } catch (err) {
                console.error('Error fetching favorites:', err);
            }
        }
        fetchFavorites();
    }, [currentUser]);

    // Submit a review
    async function handleSubmitReview(session) {
        if (reviewRating === 0) {
            toast('Please select a rating', {
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
            return;
        }
        setSubmittingReview(true);
        try {
            // 1. Write review document
            await addDoc(collection(db, 'reviews'), {
                astroId: session.astroId,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                sessionId: session.id,
                rating: reviewRating,
                comment: reviewComment.trim(),
                createdAt: serverTimestamp(),
            });

            // 2. Recalculate average rating for this astrologer
            const allReviews = await getDocs(
                query(collection(db, 'reviews'), where('astroId', '==', session.astroId))
            );
            let total = 0;
            let count = 0;
            allReviews.docs.forEach(d => {
                total += d.data().rating;
                count++;
            });
            const avgRating = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

            // 3. Update astrologer document
            await updateDoc(doc(db, 'astrologers', session.astroId), {
                rating: avgRating,
                reviews: count,
            });

            // 4. Update local state
            setReviewedSessionIds(prev => new Set(prev).add(session.id));
            setReviewFormOpen(null);
            setReviewRating(0);
            setReviewComment('');

            toast('Review submitted!', {
                description: `Thank you for rating ${session.astroName}`,
                style: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
            });
        } catch (error) {
            console.error("Error submitting review:", error);
            toast('Failed to submit review', {
                description: 'Please try again later.',
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
        } finally {
            setSubmittingReview(false);
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="container py-10 mx-auto px-4 md:px-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">My Sessions</h1>
                    <p className="text-muted-foreground mt-2">Manage and review your astrology consultations.</p>
                </div>
                <Button asChild>
                    <Link to="/astrologers">Book New Session</Link>
                </Button>
            </div>

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
                    <h3 className="text-lg font-medium text-foreground">No sessions yet</h3>
                    <p className="text-muted-foreground mt-1">You haven't booked any consultations with our astrologers.</p>
                    <Button asChild className="mt-4">
                        <Link to="/astrologers">Browse Astrologers</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {sessions.map(session => (
                        <Card key={session.id} className="overflow-hidden">
                            <CardContent className="p-0 sm:flex items-center">
                                <div className="p-6 flex-1">
                                    <div className="flex items-center justify-between mb-4 sm:mb-2 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={getStatusColor(session.status)}>
                                                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                            </Badge>
                                            {/* Call type badge */}
                                            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                                {session.callType === 'video' ? (
                                                    <><Video className="w-3 h-3" /> Video</>
                                                ) : (
                                                    <><Phone className="w-3 h-3" /> Voice</>
                                                )}
                                            </Badge>
                                        </div>
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {session.startedAt ? new Date(session.startedAt.toDate()).toLocaleDateString() : 'Pending Date'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4">
                                        <Avatar className="w-12 h-12 border">
                                            <AvatarFallback>{(session.astroName || 'A').charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-foreground">{session.astroName}</p>
                                            <p className="text-sm text-muted-foreground">Session: {session.id.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                </div>
                                {/* PENDING → Waiting */}
                                {session.status === 'pending' && (
                                    <div className="bg-yellow-50/50 p-6 sm:border-l flex items-center justify-center">
                                        <div className="text-center space-y-1">
                                            <div className="flex items-center gap-2 text-yellow-700 font-medium">
                                                <Clock className="w-4 h-4 animate-pulse" />
                                                Waiting for acceptance
                                            </div>
                                            <p className="text-xs text-yellow-600">The astrologer will accept your request soon</p>
                                        </div>
                                    </div>
                                )}

                                {/* ACTIVE → Join Call */}
                                {session.status === 'active' && (
                                    <div className="bg-primary/5 p-6 sm:border-l flex items-center justify-center">
                                        <button
                                            onClick={() => navigate(`/call-room?room=${session.roomName}&type=${session.callType}`)}
                                            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            {session.callType === 'video' ? (
                                                <><Video className="w-4 h-4" /> Join Video</>
                                            ) : (
                                                <><PhoneCall className="w-4 h-4" /> Join Voice</>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* REJECTED → Label */}
                                {session.status === 'rejected' && (
                                    <div className="bg-red-50/50 p-6 sm:border-l flex items-center justify-center">
                                        <p className="text-red-600 font-medium text-sm">Request Declined</p>
                                    </div>
                                )}

                                {/* COMPLETED → Review */}
                                {session.status === 'completed' && (
                                    <div className="bg-blue-50/50 p-6 sm:border-l flex items-center justify-center">
                                        {reviewedSessionIds.has(session.id) ? (
                                            <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Reviewed ✓
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                                onClick={() => {
                                                    setReviewFormOpen(reviewFormOpen === session.id ? null : session.id);
                                                    setReviewRating(0);
                                                    setReviewComment('');
                                                }}
                                            >
                                                <Star className="w-4 h-4" />
                                                Leave Review
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>

                            {/* Inline Review Form */}
                            {reviewFormOpen === session.id && !reviewedSessionIds.has(session.id) && (
                                <div className="border-t bg-gradient-to-r from-yellow-50/50 to-orange-50/30 p-6">
                                    <div className="max-w-lg">
                                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-yellow-600" />
                                            Rate your session with {session.astroName}
                                        </h4>

                                        {/* Star Picker */}
                                        <div className="flex items-center gap-1 mb-4">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    className="p-0.5 transition-transform hover:scale-110"
                                                    onMouseEnter={() => setReviewHover(star)}
                                                    onMouseLeave={() => setReviewHover(0)}
                                                    onClick={() => setReviewRating(star)}
                                                >
                                                    <Star
                                                        className={`w-7 h-7 transition-colors ${star <= (reviewHover || reviewRating)
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                            {reviewRating > 0 && (
                                                <span className="ml-2 text-sm font-medium text-yellow-700">
                                                    {reviewRating}/5
                                                </span>
                                            )}
                                        </div>

                                        {/* Comment */}
                                        <textarea
                                            className="w-full border rounded-lg p-3 text-sm min-h-[80px] resize-none bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                                            placeholder="Share your experience... (optional)"
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            maxLength={500}
                                        />

                                        <div className="flex items-center gap-3 mt-3">
                                            <Button
                                                size="sm"
                                                disabled={submittingReview || reviewRating === 0}
                                                onClick={() => handleSubmitReview(session)}
                                                className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm"
                                            >
                                                {submittingReview ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Star className="w-4 h-4" />
                                                )}
                                                Submit Review
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setReviewFormOpen(null)}
                                                disabled={submittingReview}
                                            >
                                                Cancel
                                            </Button>
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {reviewComment.length}/500
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* My Favorites */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-rose-500" />
                    My Favorites
                    {favorites.length > 0 && (
                        <Badge variant="secondary" className="text-xs ml-1">{favorites.length}</Badge>
                    )}
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">Your saved astrologers for quick access.</p>
                {favorites.length === 0 ? (
                    <div className="text-center py-10 bg-muted/30 rounded-lg border border-dashed">
                        <Heart className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-40" />
                        <h3 className="text-base font-medium text-foreground">No favorites yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">Browse astrologers and tap the heart to save them here!</p>
                        <Button asChild variant="outline" className="mt-4">
                            <Link to="/astrologers">Browse Astrologers</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {favorites.map(fav => (
                            <Card key={fav.favDocId} className="group hover:shadow-md transition-all hover:border-rose-200 dark:hover:border-rose-500/30">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Link to={`/astrologer/${fav.astroId}`}>
                                            <Avatar className="w-12 h-12 border-2 border-primary/20">
                                                <AvatarFallback className="text-sm">
                                                    {(fav.name || 'A').substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <Link to={`/astrologer/${fav.astroId}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate">
                                                    {fav.name || 'Astrologer'}
                                                </Link>
                                                <button
                                                    onClick={async () => {
                                                        setTogglingFav(fav.favDocId);
                                                        try {
                                                            await deleteDoc(doc(db, 'favorites', fav.favDocId));
                                                            setFavorites(prev => prev.filter(f => f.favDocId !== fav.favDocId));
                                                            toast('Removed from favorites');
                                                        } catch (e) {
                                                            console.error(e);
                                                        } finally {
                                                            setTogglingFav(null);
                                                        }
                                                    }}
                                                    disabled={togglingFav === fav.favDocId}
                                                    className="text-rose-500 hover:text-rose-600 transition-colors p-1"
                                                    title="Remove from favorites"
                                                >
                                                    <Heart className="w-4 h-4 fill-rose-500" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="flex items-center gap-0.5 text-xs text-yellow-700">
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                    {fav.rating || 'New'}
                                                </span>
                                                <Badge variant={fav.isOnline ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                                                    {fav.isOnline ? 'Online' : 'Offline'}
                                                </Badge>
                                                <span className="text-xs text-primary font-semibold">${fav.hourlyRate || 30}/hr</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <Button asChild size="sm" variant="outline" className="flex-1 text-xs h-8">
                                            <Link to={`/astrologer/${fav.astroId}`}>View Profile</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Messages card */}
            <Card className="mt-8 overflow-hidden hover:shadow-md transition-shadow border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 dark:border-blue-500/20">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    My Messages
                                    {myChats.length > 0 && (
                                        <span className="text-sm font-normal text-blue-700 dark:text-blue-400">
                                            {myChats.length} conversation{myChats.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-muted-foreground">Chat with your astrologers</p>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="gap-2 border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10">
                            <Link to="/chat">
                                <MessageCircle className="w-4 h-4" />
                                Open Chat
                            </Link>
                        </Button>
                    </div>
                    {myChats.length > 0 ? (
                        <div className="space-y-2">
                            {myChats.slice(0, 3).map(chat => (
                                <Link
                                    key={chat.id}
                                    to={`/chat?id=${chat.id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-background/60 hover:bg-background border border-transparent hover:border-border transition-all"
                                >
                                    <Avatar className="w-8 h-8 border shrink-0">
                                        <AvatarFallback className="text-xs">
                                            {(chat.astroName || 'A').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {chat.astroName || 'Astrologer'}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {chat.lastMessage || 'No messages yet'}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                        {chat.lastMessageAt?.toDate
                                            ? new Date(chat.lastMessageAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                            : ''}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-3 bg-muted/20 rounded-lg border border-dashed">
                            No conversations yet. Message an astrologer from their profile!
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
