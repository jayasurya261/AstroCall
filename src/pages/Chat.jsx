import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
    collection, query, where, orderBy, onSnapshot,
    addDoc, serverTimestamp, doc, getDoc, getDocs, setDoc, updateDoc
} from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Loader2, MessageSquare, Search } from 'lucide-react';

export default function Chat() {
    const { currentUser, userRole } = useAuth();
    const [searchParams] = useSearchParams();
    const selectedChatId = searchParams.get('id');

    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [loadingChats, setLoadingChats] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Listen to user's chats in real-time
    useEffect(() => {
        if (!currentUser) return;

        const field = userRole === 'astrologer' ? 'astroId' : 'userId';
        const q = query(
            collection(db, 'chats'),
            where(field, '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            chatList.sort((a, b) => {
                const aTime = a.lastMessageAt?.toDate?.() || new Date(0);
                const bTime = b.lastMessageAt?.toDate?.() || new Date(0);
                return bTime - aTime;
            });
            setChats(chatList);
            setLoadingChats(false);

            // Auto-select chat from URL param
            if (selectedChatId) {
                const found = chatList.find(c => c.id === selectedChatId);
                if (found) setSelectedChat(found);
            }
        });

        return () => unsubscribe();
    }, [currentUser, userRole, selectedChatId]);

    // Listen to messages for the selected chat
    useEffect(() => {
        if (!selectedChat) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, 'chats', selectedChat.id, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => unsubscribe();
    }, [selectedChat]);

    // Send message
    async function handleSend(e) {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || sending) return;

        const text = newMessage.trim();
        setNewMessage('');
        setSending(true);

        try {
            // Add message
            await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), {
                senderId: currentUser.uid,
                text,
                createdAt: serverTimestamp(),
            });

            // Update chat's last message
            await updateDoc(doc(db, 'chats', selectedChat.id), {
                lastMessage: text,
                lastMessageAt: serverTimestamp(),
            });
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    }

    // Get display name for the other person
    function getOtherName(chat) {
        if (userRole === 'astrologer') {
            return chat.userName || chat.userEmail?.split('@')[0] || 'User';
        }
        return chat.astroName || 'Astrologer';
    }

    function getOtherInitial(chat) {
        const name = getOtherName(chat);
        return name.charAt(0).toUpperCase();
    }

    // Format timestamp
    function formatTime(timestamp) {
        if (!timestamp?.toDate) return '';
        const d = new Date(timestamp.toDate());
        const now = new Date();
        const diff = now - d;
        if (diff < 86400000 && d.getDate() === now.getDate()) {
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        if (diff < 86400000 * 7) {
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        }
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const filteredChats = chats.filter(c => {
        if (!searchQuery) return true;
        const name = getOtherName(c).toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground">Please log in to access messages.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-0 md:px-4 h-[calc(100vh-4rem)]">
            <div className="flex h-full border-x md:rounded-lg md:border overflow-hidden">
                {/* Sidebar — Chat List */}
                <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r bg-background`}>
                    {/* Header */}
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Messages
                        </h2>
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto">
                        {loadingChats ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-40" />
                                <p className="text-sm text-muted-foreground">
                                    {chats.length === 0
                                        ? 'No conversations yet. Start chatting from an astrologer\'s profile!'
                                        : 'No results found.'}
                                </p>
                            </div>
                        ) : (
                            filteredChats.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b ${selectedChat?.id === chat.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                                        }`}
                                >
                                    <Avatar className="w-10 h-10 border shrink-0">
                                        <AvatarFallback className="text-sm">{getOtherInitial(chat)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-sm text-foreground truncate">{getOtherName(chat)}</p>
                                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                                {formatTime(chat.lastMessageAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {chat.lastMessage || 'No messages yet'}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main — Chat Messages */}
                <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-muted/10`}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center gap-3 p-4 border-b bg-background">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden shrink-0"
                                    onClick={() => setSelectedChat(null)}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <Avatar className="w-9 h-9 border">
                                    <AvatarFallback className="text-sm">{getOtherInitial(selectedChat)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-foreground">{getOtherName(selectedChat)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {userRole === 'astrologer' ? selectedChat.userEmail : 'Astrologer'}
                                    </p>
                                </div>
                                {userRole === 'user' && (
                                    <Button asChild variant="outline" size="sm">
                                        <Link to={`/astrologer/${selectedChat.astroId}`}>View Profile</Link>
                                    </Button>
                                )}
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-sm text-muted-foreground">Send a message to start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map(msg => {
                                        const isMe = msg.senderId === currentUser.uid;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div
                                                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                                                            ? 'bg-primary text-primary-foreground rounded-br-md'
                                                            : 'bg-background border rounded-bl-md'
                                                        }`}
                                                >
                                                    <p>{msg.text}</p>
                                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                        {msg.createdAt?.toDate
                                                            ? new Date(msg.createdAt.toDate()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                                                            : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSend} className="p-4 border-t bg-background flex items-center gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 h-10"
                                    disabled={sending}
                                />
                                <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={!newMessage.trim() || sending}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <MessageSquare className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Your Messages</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                Select a conversation from the sidebar or start a new chat from an astrologer's profile.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper: create or find an existing chat between user and astrologer
export async function getOrCreateChat(userId, userEmail, astroId, astroName) {
    // Check if chat already exists
    const q = query(
        collection(db, 'chats'),
        where('userId', '==', userId),
        where('astroId', '==', astroId)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
        return snap.docs[0].id;
    }

    // Create new chat
    const chatRef = await addDoc(collection(db, 'chats'), {
        userId,
        userEmail,
        astroId,
        astroName,
        userName: userEmail?.split('@')[0] || 'User',
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
    });

    return chatRef.id;
}
