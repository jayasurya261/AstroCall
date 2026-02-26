import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, PhoneCall, Calendar, Video, Phone, Star, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
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
        </div>
    );
}
