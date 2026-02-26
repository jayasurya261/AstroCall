import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function UserProfile() {
    const { currentUser, userRole } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ sessions: 0, reviews: 0, favorites: 0, chats: 0 });

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [bio, setBio] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        async function fetchProfile() {
            try {
                // Fetch user doc
                const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
                const userData = userSnap.exists() ? userSnap.data() : {};
                setProfile(userData);
                setDisplayName(userData.displayName || currentUser.email.split('@')[0]);
                setPhoneNumber(userData.phoneNumber || '');
                setBio(userData.bio || '');

                // Fetch stats
                const [sessionsSnap, reviewsSnap, favsSnap, chatsSnap] = await Promise.all([
                    getDocs(query(collection(db, 'sessions'), where(userRole === 'astrologer' ? 'astroId' : 'userId', '==', currentUser.uid))),
                    getDocs(query(collection(db, 'reviews'), where(userRole === 'astrologer' ? 'astroId' : 'userId', '==', currentUser.uid))),
                    getDocs(query(collection(db, 'favorites'), where('userId', '==', currentUser.uid))),
                    getDocs(query(collection(db, 'chats'), where(userRole === 'astrologer' ? 'astroId' : 'userId', '==', currentUser.uid))),
                ]);

                setStats({
                    sessions: sessionsSnap.size,
                    reviews: reviewsSnap.size,
                    favorites: favsSnap.size,
                    chats: chatsSnap.size,
                });
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [currentUser, userRole]);

    async function handleSave() {
        if (!currentUser) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                displayName: displayName.trim(),
                phoneNumber: phoneNumber.trim(),
                bio: bio.trim(),
            });

            // If astrologer, also update astrologers collection name and bio
            if (userRole === 'astrologer') {
                await updateDoc(doc(db, 'astrologers', currentUser.uid), {
                    name: displayName.trim(),
                    bio: bio.trim(),
                });
            }

            setProfile(prev => ({ ...prev, displayName: displayName.trim(), phoneNumber: phoneNumber.trim(), bio: bio.trim() }));
            setEditing(false);
            toast(t('profile.updated'), {
                style: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
            });
        } catch (err) {
            console.error('Error saving profile:', err);
            toast('Failed to save profile', {
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
        } finally {
            setSaving(false);
        }
    }

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground">Please log in to view your profile.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const memberSince = profile?.createdAt?.toDate
        ? new Date(profile.createdAt.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : profile?.createdAt instanceof Date
            ? profile.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'Recently joined';

    return (
        <div className="container py-10 mx-auto px-4 md:px-8 max-w-3xl">
            {/* Header Card */}
            <Card className="overflow-hidden">
                {/* Banner */}
                <div className="h-28 bg-gradient-to-r from-primary/80 via-primary/60 to-violet-500/50 relative">
                    <div className="absolute -bottom-12 left-6">
                        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                            <AvatarImage src={currentUser.photoURL} />
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                {(displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                <CardContent className="pt-16 pb-6 px-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-foreground">
                                    {editing ? (
                                        <Input
                                            value={displayName}
                                            onChange={e => setDisplayName(e.target.value)}
                                            className="text-2xl font-bold h-9 w-64"
                                            placeholder={t('profile.title')}
                                        />
                                    ) : (
                                        displayName || currentUser.email?.split('@')[0]
                                    )}
                                </h1>
                                {!editing && <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />}
                            </div>
                            <span>Email: {currentUser.email}</span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="font-bold border-border bg-background text-foreground hover:bg-muted" onClick={() => setEditing(true)}>
                        {t('profile.editProfile')}
                    </Button>
                    <div className="flex gap-2">
                        <Button size="sm" className="font-bold bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {t('profile.save')}
                        </Button>
                        <Button variant="outline" size="sm" className="font-bold border-border bg-background text-foreground hover:bg-muted" onClick={() => {
                            setEditing(false);
                            setDisplayName(profile?.displayName || currentUser.email.split('@')[0]);
                            setPhoneNumber(profile?.phoneNumber || '');
                            setBio(profile?.bio || '');
                        }}>
                            Cancel
                        </Button>
                    </div>
                        )}
                </div>

                {/* Info rows */}
                <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{t('profile.role')}:</span>
                        <Badge variant="secondary" className="capitalize">{userRole}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{t('profile.memberSince')}:</span>
                        <span className="text-foreground font-medium">{memberSince}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{t('profile.phone')}:</span>
                        {editing ? (
                            <Input
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                placeholder="Your phone number"
                                className="h-8 w-52"
                            />
                        ) : (
                            <span className="text-foreground font-medium">
                                {profile?.phoneNumber || t('profile.notSet')}
                            </span>
                        )}
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                        <span className="text-muted-foreground shrink-0">{t('profile.bio')}:</span>
                        {editing ? (
                                <textarea
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    className="flex-1 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                                    maxLength={300}
                                />
                                <span className="text-foreground leading-relaxed whitespace-pre-wrap">
                                    {profile?.bio || t('profile.noBio')}
                                </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>

            {/* Stats */ }
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card className="hover:shadow-sm transition-shadow border-border">
            <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.sessions}</p>
                <p className="text-xs text-muted-foreground">{t('profile.sessions')}</p>
            </CardContent>
        </Card>
        <Card className="hover:shadow-sm transition-shadow border-border">
            <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.reviews}</p>
                <p className="text-xs text-muted-foreground">{t('profile.reviews')}</p>
            </CardContent>
        </Card>
        <Card className="hover:shadow-sm transition-shadow border-border">
            <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.favorites}</p>
                <p className="text-xs text-muted-foreground">{t('profile.favorites')}</p>
            </CardContent>
        </Card>
        <Card className="hover:shadow-sm transition-shadow border-border">
            <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.chats}</p>
                <p className="text-xs text-muted-foreground">{t('profile.conversations')}</p>
            </CardContent>
        </Card>
    </div>

    {/* Quick Links */ }
    <Card className="mt-6">
        <CardContent className="p-5">
            <h3 className="font-semibold text-foreground mb-3">{t('profile.quickLinks')}</h3>
            <div className="flex flex-wrap gap-2">
                {userRole === 'user' && (
                    <>
                        <Button asChild variant="outline" size="sm">
                            <Link to="/user-dashboard">{t('nav.mySessions')}</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link to="/favorites">{t('nav.myFavorites')}</Link>
                        </Button>
                    </>
                )}
                {userRole === 'astrologer' && (
                    <>
                        <Button asChild variant="outline" size="sm">
                            <Link to="/astrologer-dashboard">{t('nav.dashboard')}</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link to="/astrologer-reviews">{t('nav.myReviews')}</Link>
                        </Button>
                    </>
                )}
                <Button asChild variant="outline" size="sm">
                    <Link to="/chat">{t('nav.messages')}</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                    <Link to="/astrologers">{t('nav.astrologers')}</Link>
                </Button>
            </div>
        </CardContent>
    </Card>
        </div >
    );
}
