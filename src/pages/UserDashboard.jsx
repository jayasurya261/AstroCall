import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, PhoneCall, Calendar } from 'lucide-react';

export default function UserDashboard() {
    const { currentUser } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        async function fetchSessions() {
            try {
                const q = query(
                    collection(db, 'sessions'),
                    where('userId', '==', currentUser.uid),
                    orderBy('startedAt', 'desc')
                );

                const querySnapshot = await getDocs(q);
                const fetchedSessions = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setSessions(fetchedSessions);
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

    return (
        <div className="container py-10 mx-auto px-4 md:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">My Sessions</h1>
                <p className="text-muted-foreground mt-2">Manage and review your astrology consultations.</p>
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
                </div>
            ) : (
                <div className="grid gap-4">
                    {sessions.map(session => (
                        <Card key={session.id} className="overflow-hidden">
                            <CardContent className="p-0 sm:flex items-center">
                                <div className="p-6 flex-1">
                                    <div className="flex items-center justify-between mb-4 sm:mb-2">
                                        <Badge variant="outline" className={getStatusColor(session.status)}>
                                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {session.startedAt ? new Date(session.startedAt.toDate()).toLocaleDateString() : 'Pending Date'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4">
                                        <Avatar className="w-12 h-12 border">
                                            <AvatarFallback>AST</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-foreground">Astrologer ID: {session.astroId.substring(0, 8)}...</p>
                                            <p className="text-sm text-muted-foreground">Session ID: {session.id}</p>
                                        </div>
                                    </div>
                                </div>
                                {session.status === 'active' && (
                                    <div className="bg-primary/5 p-6 sm:border-l sm:h-full flex items-center justify-center">
                                        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
                                            <PhoneCall className="w-4 h-4" />
                                            Rejoin Call
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
