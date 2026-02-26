import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, ArrowLeft, TrendingUp, ShieldCheck } from 'lucide-react';

export default function AstrologerReviews() {
    const { currentUser, userRole } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || userRole !== 'astrologer') return;

        async function fetchReviews() {
            try {
                const q = query(
                    collection(db, 'reviews'),
                    where('astroId', '==', currentUser.uid)
                );
                const snap = await getDocs(q);
                const revs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                revs.sort((a, b) => {
                    const aTime = a.createdAt?.toDate?.() || new Date(0);
                    const bTime = b.createdAt?.toDate?.() || new Date(0);
                    return bTime - aTime;
                });
                setReviews(revs);
            } catch (err) {
                console.error('Error fetching reviews:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchReviews();
    }, [currentUser]);

    const avgRating = reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

    const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
    }));

    if (userRole !== 'astrologer') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4 text-destructive">
                <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="mt-2 text-muted-foreground">This page is only available to astrologers.</p>
                <Button asChild className="mt-6">
                    <Link to="/">Go Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container py-10 mx-auto px-4 md:px-8">
            {/* Header */}
            <div className="mb-8">
                <Button asChild variant="ghost" size="sm" className="mb-4 gap-2 text-muted-foreground">
                    <Link to="/astrologer-dashboard">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-yellow-600" />
                    My Reviews
                </h1>
                <p className="text-muted-foreground mt-2">All feedback received from your clients.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Average Rating Card */}
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-yellow-100 border border-yellow-200 flex items-center justify-center">
                            <Star className="w-8 h-8 fill-yellow-500 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-yellow-700">{avgRating || '—'}</p>
                            <p className="text-sm text-yellow-600 font-medium">Average Rating</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Reviews Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-blue-700">{reviews.length}</p>
                            <p className="text-sm text-blue-600 font-medium">Total Reviews</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Rating Breakdown */}
                <Card className="border-muted">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            Rating Breakdown
                        </p>
                        <div className="space-y-1.5">
                            {ratingCounts.map(({ star, count }) => (
                                <div key={star} className="flex items-center gap-2 text-xs">
                                    <span className="w-4 text-right font-medium text-muted-foreground">{star}</span>
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 rounded-full transition-all"
                                            style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                                        />
                                    </div>
                                    <span className="w-6 text-right text-muted-foreground">{count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reviews List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="h-24 bg-muted/50"></CardContent>
                        </Card>
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
                    <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-40" />
                    <h3 className="text-lg font-medium text-foreground">No reviews yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                        When clients rate your sessions, their reviews will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {reviews.map(review => (
                        <Card key={review.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10 border">
                                            <AvatarFallback className="text-sm">
                                                {(review.userEmail || 'U').charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm text-foreground">{review.userEmail}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {review.createdAt?.toDate
                                                    ? new Date(review.createdAt.toDate()).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'long', day: 'numeric'
                                                    })
                                                    : 'Recent'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-200">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star
                                                key={s}
                                                className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {review.comment && (
                                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed pl-[52px]">
                                        "{review.comment}"
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
