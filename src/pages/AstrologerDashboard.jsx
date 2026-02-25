import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, PhoneCall, Calendar, Video, Phone } from 'lucide-react';

export default function AstrologerDashboard() {
    const { currentUser } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        async function fetchSessions() {
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

                // Sort client-side: newest first
                sessionsWithUserData.sort((a, b) => {
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

        fetchSessions();
    }, [currentUser]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const pendingCount = sessions.filter(s => s.status === 'pending').length;
    const activeCount = sessions.filter(s => s.status === 'active').length;

    return (
        <div className="container py-10 mx-auto px-4 md:px-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Astrologer Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Manage your incoming consultations and active calls.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-center">
                        <p className="text-xl font-bold text-yellow-700">{pendingCount}</p>
                        <p className="text-xs text-yellow-600 font-medium">Pending</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center">
                        <p className="text-xl font-bold text-green-700">{activeCount}</p>
                        <p className="text-xs text-green-600 font-medium">Active</p>
                    </div>
                    <div className="bg-muted/50 border rounded-lg px-4 py-2 text-center">
                        <p className="text-xl font-bold text-foreground">{sessions.length}</p>
                        <p className="text-xs text-muted-foreground font-medium">Total</p>
                    </div>
                </div>
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
                    <h3 className="text-lg font-medium text-foreground">No bookings yet</h3>
                    <p className="text-muted-foreground mt-1">When users book a consultation with you, it will appear here.</p>
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
                                                    <><Video className="w-3 h-3" /> Video Call</>
                                                ) : (
                                                    <><Phone className="w-3 h-3" /> Voice Call</>
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
                                            <AvatarFallback>{session.userEmail.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-foreground">{session.userEmail}</p>
                                            <p className="text-sm text-muted-foreground">Session: {session.id.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                </div>
                                {(session.status === 'active' || session.status === 'pending') && (
                                    <div className="bg-primary/5 p-6 sm:border-l flex items-center justify-center">
                                        <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors">
                                            {session.callType === 'video' ? (
                                                <><Video className="w-4 h-4" /> Join Video Call</>
                                            ) : (
                                                <><PhoneCall className="w-4 h-4" /> Join Voice Call</>
                                            )}
                                        </button>
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
