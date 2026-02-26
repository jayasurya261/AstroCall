import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Star, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function Favorites() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState(null);

    useEffect(() => {
        if (!currentUser) return;

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
            } finally {
                setLoading(false);
            }
        }
        fetchFavorites();
    }, [currentUser]);

    async function handleRemove(favDocId) {
        setRemoving(favDocId);
        try {
            await deleteDoc(doc(db, 'favorites', favDocId));
            setFavorites(prev => prev.filter(f => f.favDocId !== favDocId));
            toast(t('favorites.removed'));
        } catch (err) {
            console.error(err);
        } finally {
            setRemoving(null);
        }
    }

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground">Please log in to see your favorites.</p>
            </div>
        );
    }

    return (
        <div className="container py-10 mx-auto px-4 md:px-8 max-w-5xl">
            <Button asChild variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground">
                <Link to="/user-dashboard">
                    <ArrowLeft className="w-4 h-4" />
                    {t('favorites.backToDashboard')}
                </Link>
            </Button>

            <div className="flex items-center gap-3 mb-2">
                <Heart className="w-7 h-7 text-rose-500" />
                <h1 className="text-3xl font-bold text-foreground">{t('favorites.title')}</h1>
                {favorites.length > 0 && (
                    <Badge variant="secondary" className="text-sm">{favorites.length}</Badge>
                )}
            </div>
            <p className="text-muted-foreground mb-8">{t('favorites.subtitle')}</p>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : favorites.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                    <Heart className="w-14 h-14 mx-auto text-muted-foreground mb-4 opacity-40" />
                    <h2 className="text-xl font-semibold text-foreground">{t('favorites.empty')}</h2>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        {t('favorites.emptyDesc')}
                    </p>
                    <Button asChild className="mt-6">
                        <Link to="/astrologers">{t('favorites.browseAstrologers')}</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {favorites.map(fav => (
                        <Card key={fav.favDocId} className="group hover:shadow-lg transition-all hover:border-rose-200 dark:hover:border-rose-500/30 overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <Link to={`/astrologer/${fav.astroId}`}>
                                        <Avatar className="w-14 h-14 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                                            <AvatarImage src={fav.photoURL || `https://i.pravatar.cc/150?u=${fav.astroId}`} />
                                            <AvatarFallback className="text-lg">
                                                {(fav.name || 'A').substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <Link to={`/astrologer/${fav.astroId}`} className="font-bold text-foreground hover:text-primary transition-colors truncate flex items-center gap-1.5">
                                                {fav.name || 'Astrologer'}
                                                <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20 shrink-0" />
                                            </Link>
                                            <button
                                                onClick={() => handleRemove(fav.favDocId)}
                                                disabled={removing === fav.favDocId}
                                                className="text-rose-500 hover:text-rose-600 transition-colors p-1 shrink-0"
                                                title="Remove from favorites"
                                            >
                                                {removing === fav.favDocId ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Heart className="w-5 h-5 fill-rose-500" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="flex items-center gap-0.5 text-xs text-yellow-700">
                                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                                {fav.rating || 'New'}
                                            </span>
                                            <Badge variant={fav.isOnline ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                                                {fav.isOnline ? 'Online' : 'Offline'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-semibold text-primary mt-1.5">
                                            ${fav.hourlyRate || 30}/hr
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button asChild size="sm" className="flex-1 gap-1.5 h-9">
                                        <Link to={`/astrologer/${fav.astroId}`}>{t('favorites.viewProfile')}</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
