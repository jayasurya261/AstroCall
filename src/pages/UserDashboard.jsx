import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, PhoneCall, Calendar, Video, Phone } from 'lucide-react';

export default function UserDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

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
            } catch (error) {
                console.error("Error fetching sessions:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSessions();
    }, [currentUser]);

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
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
