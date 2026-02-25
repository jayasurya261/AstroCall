import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Video, Phone, Star, CheckCircle2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Astrologers() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [astrologers, setAstrologers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingId, setBookingId] = useState(null); // tracks which astrologer is being booked

    useEffect(() => {
        async function fetchAstrologers() {
            try {
                const querySnapshot = await getDocs(collection(db, 'astrologers'));
                const fetchedAstros = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                fetchedAstros.sort((a, b) => {
                    if (a.isOnline === b.isOnline) return (a.name || '').localeCompare(b.name || '');
                    return a.isOnline ? -1 : 1;
                });

                setAstrologers(fetchedAstros);
            } catch (error) {
                console.error("Error fetching astrologers:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAstrologers();
    }, []);

    async function handleBook(astroId, callType) {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        setBookingId(astroId + '-' + callType);
        try {
            // Generate a unique room name
            const roomName = `astrocall-${astroId.substring(0, 6)}-${Date.now()}`;

            await addDoc(collection(db, 'sessions'), {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                astroId: astroId,
                callType: callType,
                roomName: roomName,
                status: 'pending',
                startedAt: serverTimestamp(),
            });

            toast(`${callType === 'video' ? 'Video' : 'Voice'} call request sent!`, {
                description: 'Waiting for the astrologer to accept...',
                style: { background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' },
            });

            navigate('/user-dashboard');
        } catch (error) {
            console.error("Error booking session:", error);
            toast('Failed to book session', {
                description: 'Please try again later.',
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
        } finally {
            setBookingId(null);
        }
    }

    return (
        <div className="container py-10 mx-auto px-4 md:px-8">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl mb-4">
                    Our <span className="text-primary">Astrologers</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Connect instantly with verified experts. Choose your preferred astrologer and start a live consultation.
                </p>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse h-96 bg-muted/30"></Card>
                    ))}
                </div>
            ) : astrologers.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground">No astrologers available yet</h3>
                    <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                        Astrologers will appear here once they register and are verified on the platform.
                    </p>
                    <Button asChild variant="outline" className="mt-6">
                        <Link to="/login">Become an Astrologer</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {astrologers.map(astro => (
                        <Card key={astro.id} className={`overflow-hidden flex flex-col transition-colors ${astro.isOnline ? 'hover:border-primary/50' : 'opacity-75'}`}>
                            <CardHeader className="p-6 pb-0 flex flex-row items-start gap-4 space-y-0">
                                <div className="relative">
                                    <Avatar className="w-20 h-20 border-2 border-primary/20">
                                        <AvatarImage src={`https://i.pravatar.cc/150?u=${astro.id}`} />
                                        <AvatarFallback>{(astro.name || 'AS').substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-background ${astro.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                </div>
                                <div className="flex flex-col flex-1 pl-2">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <h3 className="font-bold text-lg leading-none">{astro.name || 'Astrologer'}</h3>
                                        <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20" />
                                    </div>
                                    <div className="flex items-center gap-1 text-sm font-medium text-yellow-600 mb-2">
                                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                        <span>{astro.rating || 'New'}</span>
                                        <span className="text-muted-foreground font-normal ml-1">
                                            ({astro.reviews || 0} reviews)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-primary">
                                            ${astro.hourlyRate || 30}/hr
                                        </p>
                                        <Badge variant={astro.isOnline ? "default" : "secondary"} className="text-xs">
                                            {astro.isOnline ? "Online" : "Offline"}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 flex-1">
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                    {astro.bio || 'Professional Astrologer dedicated to helping you find your path.'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {astro.languages?.map(lang => (
                                        <Badge key={lang} variant="secondary" className="bg-muted/50 text-xs py-0">
                                            {lang}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 pt-0 gap-3">
                                <Button
                                    className="flex-1 gap-2 shadow-md shadow-primary/20"
                                    disabled={!!bookingId}
                                    onClick={() => handleBook(astro.id, 'video')}
                                >
                                    {bookingId === astro.id + '-video' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Video className="w-4 h-4" />
                                    )}
                                    Video Call
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2 bg-muted/10"
                                    disabled={!!bookingId}
                                    onClick={() => handleBook(astro.id, 'voice')}
                                >
                                    {bookingId === astro.id + '-voice' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Phone className="w-4 h-4" />
                                    )}
                                    Voice Call
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
