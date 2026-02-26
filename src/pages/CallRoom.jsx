import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { generateLiveKitToken, getLiveKitUrl } from '@/lib/livekit';
import { LiveKitRoom, VideoConference, RoomAudioRenderer, ControlBar } from '@livekit/components-react';
import '@livekit/components-styles';
import { Button } from '@/components/ui/button';
import { Loader2, PhoneOff } from 'lucide-react';

export default function CallRoom() {
    const { currentUser, userRole } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const roomName = searchParams.get('room');
    const callType = searchParams.get('type') || 'video';

    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!currentUser || !roomName) return;

        async function getToken() {
            try {
                const t = await generateLiveKitToken(roomName, currentUser.uid, callType);
                setToken(t);
            } catch (err) {
                console.error('Token generation error:', err);
                setError('Failed to generate access token.');
            } finally {
                setLoading(false);
            }
        }

        getToken();
    }, [currentUser, roomName, callType]);

    async function handleDisconnect() {
        // Mark session as completed when someone leaves the call
        try {
            const q = query(
                collection(db, 'sessions'),
                where('roomName', '==', roomName),
                where('status', '==', 'active')
            );
            const snap = await getDocs(q);
            for (const sessionDoc of snap.docs) {
                await updateDoc(doc(db, 'sessions', sessionDoc.id), {
                    status: 'completed',
                });
            }
        } catch (err) {
            console.error('Error marking session as completed:', err);
        }

        // Redirect to the appropriate dashboard
        if (userRole === 'astrologer') {
            navigate('/astrologer-dashboard');
        } else {
            navigate('/user-dashboard');
        }
    }

    // ─── Loading State ───────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Connecting to {callType} call...</p>
                </div>
            </div>
        );
    }

    // ─── Error State ─────────────────────────────────────────────────
    if (error || !token || !roomName) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <div className="text-center space-y-4">
                    <PhoneOff className="w-10 h-10 text-red-500 mx-auto" />
                    <p className="text-red-500 font-medium">{error || 'Invalid call link.'}</p>
                    <Button onClick={() => navigate('/')}>Go Home</Button>
                </div>
            </div>
        );
    }

    // ─── Voice-Only Call ─────────────────────────────────────────────
    if (callType === 'voice') {
        return (
            <div className="h-[calc(100vh-4rem)] flex flex-col" data-lk-theme="default">
                <LiveKitRoom
                    serverUrl={getLiveKitUrl()}
                    token={token}
                    connect={true}
                    audio={true}
                    video={false}
                    onDisconnected={handleDisconnect}
                    style={{ height: '100%' }}
                >
                    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-8">
                        <div className="text-center space-y-6 max-w-md">
                            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" x2="12" y1="19" y2="22" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Voice Call Active</h2>
                                <p className="text-muted-foreground mt-1">Room: {roomName}</p>
                            </div>
                        </div>
                    </div>
                    <RoomAudioRenderer />
                    <ControlBar variation="minimal" controls={{ camera: false, screenShare: false }} />
                </LiveKitRoom>
            </div>
        );
    }

    // ─── Video Call ──────────────────────────────────────────────────
    return (
        <div className="h-[calc(100vh-4rem)]" data-lk-theme="default">
            <LiveKitRoom
                serverUrl={getLiveKitUrl()}
                token={token}
                connect={true}
                audio={true}
                video={true}
                onDisconnected={handleDisconnect}
                style={{ height: '100%' }}
            >
                <VideoConference />
            </LiveKitRoom>
        </div>
    );
}
