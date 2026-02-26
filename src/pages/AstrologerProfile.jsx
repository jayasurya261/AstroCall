import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Star, Video, Phone, CheckCircle2, ArrowLeft, Loader2,
    Globe, Clock, MessageSquare, TrendingUp, UserX, Heart, Flag
} from 'lucide-react';
import { toast } from 'sonner';
import { getOrCreateChat } from '@/pages/Chat';

export default function AstrologerProfile() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [astro, setAstro] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingId, setBookingId] = useState(null);
    const [startingChat, setStartingChat] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [favDocId, setFavDocId] = useState(null);
    const [togglingFav, setTogglingFav] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch astrologer profile
                const astroDoc = await getDoc(doc(db, 'astrologers', id));
                if (astroDoc.exists()) {
                    setAstro({ id: astroDoc.id, ...astroDoc.data() });
                }

                // Fetch reviews
                const q = query(collection(db, 'reviews'), where('astroId', '==', id));
                const snap = await getDocs(q);
                const revs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                revs.sort((a, b) => {
                    const aTime = a.createdAt?.toDate?.() || new Date(0);
                    const bTime = b.createdAt?.toDate?.() || new Date(0);
                    return bTime - aTime;
                });
                setReviews(revs);
            } catch (err) {
                console.error('Error fetching astrologer:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();

        // Check if favorited
        async function checkFavorite() {
            if (!currentUser) return;
            try {
                const q = query(
                    collection(db, 'favorites'),
                    where('userId', '==', currentUser.uid),
                    where('astroId', '==', id)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    setIsFavorited(true);
                    setFavDocId(snap.docs[0].id);
                }
            } catch (e) { /* ignore */ }
        }
        checkFavorite();
    }, [id, currentUser]);

    async function handleBook(callType) {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setBookingId(callType);
        try {
            const roomName = `astrocall-${id.substring(0, 6)}-${Date.now()}`;
            await addDoc(collection(db, 'sessions'), {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                astroId: id,
                callType,
                roomName,
                status: 'pending',
                startedAt: serverTimestamp(),
            });
            toast(`${callType === 'video' ? 'Video' : 'Voice'} call request sent!`, {
                description: 'Waiting for the astrologer to accept...',
                style: { background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' },
            });
            navigate('/user-dashboard');
        } catch (err) {
            console.error('Booking error:', err);
            toast('Failed to book session', {
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
        } finally {
            setBookingId(null);
        }
    }

    async function handleMessage() {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setStartingChat(true);
        try {
            const chatId = await getOrCreateChat(
                currentUser.uid,
                currentUser.email,
                id,
                astro?.name || 'Astrologer'
            );
            navigate(`/chat?id=${chatId}`);
        } catch (err) {
            console.error('Error starting chat:', err);
            toast('Failed to start chat', {
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
        } finally {
            setStartingChat(false);
        }
    }

    const avgRating = reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

    const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
    }));

    // Loading
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    // Not found
    if (!astro) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <UserX className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                <h1 className="text-2xl font-bold text-foreground">Astrologer Not Found</h1>
                <p className="text-muted-foreground mt-2">This profile doesn't exist or has been removed.</p>
                <Button asChild className="mt-6">
                    <Link to="/astrologers">Browse Astrologers</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container py-10 mx-auto px-4 md:px-8 max-w-5xl">
            {/* Back button */}
            <Button asChild variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground">
                <Link to="/astrologers">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Astrologers
                </Link>
            </Button>

            {/* Profile Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                {/* Left: Avatar + Info */}
                <div className="md:col-span-2">
                    <div className="flex items-start gap-6">
                        <div className="relative">
                            <Avatar className="w-24 h-24 border-2 border-primary/20">
                                <AvatarImage src={astro.photoURL || `https://i.pravatar.cc/150?u=${astro.id}`} />
                                <AvatarFallback className="text-2xl">{(astro.name || 'AS').substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-background ${astro.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-foreground">{astro.name || 'Astrologer'}</h1>
                                {astro.verified && <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" title="Verified Astrologer" />}
                                <Badge variant={astro.isOnline ? "default" : "secondary"} className="ml-2">
                                    {astro.isOnline ? "Online" : "Offline"}
                                </Badge>
                                <button
                                    className="ml-auto p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                    disabled={togglingFav}
                                    title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                                    onClick={async () => {
                                        if (!currentUser) { navigate('/login'); return; }
                                        setTogglingFav(true);
                                        try {
                                            if (isFavorited) {
                                                await deleteDoc(doc(db, 'favorites', favDocId));
                                                setIsFavorited(false);
                                                setFavDocId(null);
                                                toast('Removed from favorites');
                                            } else {
                                                const ref = await addDoc(collection(db, 'favorites'), { userId: currentUser.uid, astroId: id, createdAt: serverTimestamp() });
                                                setIsFavorited(true);
                                                setFavDocId(ref.id);
                                                toast('Added to favorites!');
                                            }
                                        } catch (err) {
                                            console.error(err);
                                        } finally {
                                            setTogglingFav(false);
                                        }
                                    }}
                                >
                                    <Heart className={`w-6 h-6 transition-colors ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground hover:text-rose-400'}`} />
                                </button>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star
                                            key={s}
                                            className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-yellow-700">{avgRating || 'New'}</span>
                                <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
                            </div>

                            {/* Details */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-semibold text-primary">${astro.hourlyRate || 30}/hr</span>
                                </div>
                                {astro.languages?.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <Globe className="w-4 h-4" />
                                        <span>{astro.languages.join(', ')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Languages as badges */}
                            {astro.languages?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {astro.languages.map(lang => (
                                        <Badge key={lang} variant="secondary" className="text-xs">
                                            {lang}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {astro.bio || 'Professional Astrologer dedicated to helping you find your path through the stars. Specializing in Vedic astrology, career guidance, and relationship counseling. With years of experience, I provide accurate and insightful readings to help you navigate life\'s challenges.'}
                        </p>
                    </div>

                    {/* Specializations */}
                    {astro.specializations?.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-lg font-semibold text-foreground mb-2">Specializations</h2>
                            <div className="flex flex-wrap gap-2">
                                {astro.specializations.map(spec => (
                                    <Badge key={spec} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                        {spec}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Booking Card */}
                <div>
                    <Card className="sticky top-24 border-primary/20">
                        <CardContent className="p-6">
                            <div className="text-center mb-4">
                                <p className="text-3xl font-bold text-foreground">${astro.hourlyRate || 30}</p>
                                <p className="text-sm text-muted-foreground">per hour</p>
                            </div>

                            {astro.isOnline ? (
                                <div className="space-y-3">
                                    <Button
                                        className="w-full gap-2 h-11 shadow-md shadow-primary/20"
                                        disabled={!!bookingId}
                                        onClick={() => handleBook('video')}
                                    >
                                        {bookingId === 'video' ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Video className="w-4 h-4" />
                                        )}
                                        Book Video Call
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2 h-11"
                                        disabled={!!bookingId}
                                        onClick={() => handleBook('voice')}
                                    >
                                        {bookingId === 'voice' ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Phone className="w-4 h-4" />
                                        )}
                                        Book Voice Call
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-muted/30 rounded-lg border border-dashed">
                                    <p className="text-sm text-muted-foreground">Currently offline</p>
                                    <p className="text-xs text-muted-foreground mt-1">Check back later for availability</p>
                                </div>
                            )}

                            {/* Message Button — always visible */}
                            <Button
                                variant="outline"
                                className="w-full gap-2 h-11 mt-3"
                                disabled={startingChat}
                                onClick={handleMessage}
                            >
                                {startingChat ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <MessageSquare className="w-4 h-4" />
                                )}
                                Send Message
                            </Button>

                            {/* Quick stats */}
                            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-foreground">{avgRating || '—'}</p>
                                    <p className="text-xs text-muted-foreground">Rating</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-foreground">{reviews.length}</p>
                                    <p className="text-xs text-muted-foreground">Reviews</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t pt-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-yellow-600" />
                        Client Reviews ({reviews.length})
                    </h2>
                </div>

                {/* Rating Summary */}
                {reviews.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-5xl font-bold text-foreground">{avgRating}</p>
                                <div className="flex items-center gap-0.5 mt-1 justify-center">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star
                                            key={s}
                                            className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                {ratingCounts.map(({ star, count }) => (
                                    <div key={star} className="flex items-center gap-2 text-xs">
                                        <span className="w-3 text-right font-medium text-muted-foreground">{star}</span>
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400 rounded-full transition-all"
                                                style={{ width: `${(count / reviews.length) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-6 text-right text-muted-foreground">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Cards */}
                {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                        <Star className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-40" />
                        <h3 className="text-base font-medium text-foreground">No reviews yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">Be the first to review this astrologer!</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {reviews.map(review => (
                            <Card key={review.id} className="hover:shadow-sm transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border">
                                                <AvatarFallback className="text-sm">
                                                    {(review.userEmail || 'U').charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm text-foreground">
                                                    {review.userEmail?.split('@')[0] || 'User'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {review.createdAt?.toDate
                                                        ? new Date(review.createdAt.toDate()).toLocaleDateString('en-US', {
                                                            year: 'numeric', month: 'long', day: 'numeric'
                                                        })
                                                        : 'Recent'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 bg-yellow-50 dark:bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-200 dark:border-yellow-500/20">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed pl-[52px]">
                                            "{review.comment}"
                                        </p>
                                    )}
                                    {currentUser && (
                                        <div className="flex justify-end mt-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await addDoc(collection(db, 'reports'), {
                                                            type: 'review',
                                                            contentId: review.id,
                                                            content: review.comment || '',
                                                            rating: review.rating,
                                                            reportedUserEmail: review.userEmail,
                                                            astroId: id,
                                                            reportedBy: currentUser.uid,
                                                            reportedByEmail: currentUser.email,
                                                            status: 'pending',
                                                            createdAt: serverTimestamp(),
                                                        });
                                                        toast('Review reported', {
                                                            description: 'Admin will review this content.',
                                                            style: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
                                                        });
                                                    } catch (err) {
                                                        console.error('Error reporting:', err);
                                                        toast('Failed to report', { style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' } });
                                                    }
                                                }}
                                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
                                                title="Report this review"
                                            >
                                                <Flag className="w-3 h-3" /> Report
                                            </button>
                                        </div>
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
