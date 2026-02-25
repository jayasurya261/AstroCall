import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, PhoneCall, Calendar, Video, Phone, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AstrologerDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // tracks which session is being acted on

    async function fetchSessions() {
        if (!currentUser) return;
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

            sessionsWithUserData.sort((a, b) => {
                // Pending first, then active, then rest
                const priority = { pending: 0, active: 1, completed: 2, rejected: 3, cancelled: 4 };
                const pA = priority[a.status] ?? 5;
                const pB = priority[b.status] ?? 5;
                if (pA !== pB) return pA - pB;
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

    useEffect(() => {
        fetchSessions();
    }, [currentUser]);

    // Accept a session
    async function handleAccept(sessionId) {
        setActionLoading(sessionId + '-accept');
        try {
            await updateDoc(doc(db, 'sessions', sessionId), { status: 'active' });

            // Find the session to get its room info
            const session = sessions.find(s => s.id === sessionId);

            toast('Session accepted! Joining call...', {
                style: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
            });

            // Navigate directly to the call room
            if (session?.roomName) {
                navigate(`/call-room?room=${session.roomName}&type=${session.callType}`);
            } else {
                await fetchSessions();
            }
        } catch (err) {
            console.error("Error accepting session:", err);
            toast('Failed to accept session', {
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
        } finally {
            setActionLoading(null);
        }
    }

    // Reject a session
    async function handleReject(sessionId) {
        setActionLoading(sessionId + '-reject');
        try {
            await updateDoc(doc(db, 'sessions', sessionId), { status: 'rejected' });
            toast('Session rejected.', {
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
            await fetchSessions();
        } catch (err) {
            console.error("Error rejecting session:", err);
        } finally {
            setActionLoading(null);
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
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
                        <Card key={session.id} className={`overflow-hidden ${session.status === 'pending' ? 'border-yellow-300 shadow-sm shadow-yellow-100' : ''}`}>
                            <CardContent className="p-0 sm:flex items-center">
                                <div className="p-6 flex-1">
                                    <div className="flex items-center justify-between mb-4 sm:mb-2 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={getStatusColor(session.status)}>
                                                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                            </Badge>
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
                                            {session.startedAt ? new Date(session.startedAt.toDate()).toLocaleDateString() : 'Pending'}
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

                                {/* PENDING → Show Accept / Reject */}
                                {session.status === 'pending' && (
                                    <div className="bg-yellow-50/50 p-6 sm:border-l flex flex-col items-center justify-center gap-3">
                                        <Button
                                            onClick={() => handleAccept(session.id)}
                                            disabled={!!actionLoading}
                                            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Check className="w-4 h-4" />
                                            {actionLoading === session.id + '-accept' ? 'Accepting...' : 'Accept'}
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(session.id)}
                                            disabled={!!actionLoading}
                                            variant="outline"
                                            className="w-full gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                            {actionLoading === session.id + '-reject' ? 'Rejecting...' : 'Reject'}
                                        </Button>
                                    </div>
                                )}

                                {/* ACTIVE → Show Join Call */}
                                {session.status === 'active' && (
                                    <div className="bg-primary/5 p-6 sm:border-l flex items-center justify-center">
                                        <Button
                                            onClick={() => navigate(`/call-room?room=${session.roomName}&type=${session.callType}`)}
                                            className="gap-2"
                                        >
                                            {session.callType === 'video' ? (
                                                <><Video className="w-4 h-4" /> Join Video Call</>
                                            ) : (
                                                <><PhoneCall className="w-4 h-4" /> Join Voice Call</>
                                            )}
                                        </Button>
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
