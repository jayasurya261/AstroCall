import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ShieldCheck, UserCog, User, Video, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
    const { currentUser, userRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Prevent non-superadmins from loading data
        if (!currentUser || userRole !== 'superadmin') {
            setLoading(false);
            return;
        }

        async function fetchAllUsers() {
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const fetchedUsers = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort users: pending/users first, then astrologers, then superadmins
                fetchedUsers.sort((a, b) => {
                    const rank = { user: 1, astrologer: 2, superadmin: 3 };
                    return (rank[a.role] || 0) - (rank[b.role] || 0);
                });
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAllUsers();
    }, [currentUser, userRole]);

    const promoteToAstrologer = async (userId, userEmail) => {
        try {
            // Update role in 'users' collection
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                role: 'astrologer'
            });

            // Add them to 'astrologers' collection so they show up in the directory
            const astroRef = doc(db, 'astrologers', userId);
            await setDoc(astroRef, {
                name: userEmail.split('@')[0], // Placeholder name
                bio: "New astrologer verified by AstroCall Admin.",
                languages: ["English"],
                isOnline: false,
                rating: 0,
                reviews: 0,
                hourlyRate: 30
            });

            // Update UI
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, role: 'astrologer' } : u
            ));

        } catch (error) {
            console.error("Error promoting user:", error);
            alert("Failed to promote user. Check permissions.");
        }
    };

    if (userRole !== 'superadmin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4 text-destructive">
                <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="mt-2 text-muted-foreground">You must be a Super Admin to view this page.</p>
            </div>
        );
    }

    const astrologersCount = users.filter(u => u.role === 'astrologer').length;
    const usersCount = users.filter(u => u.role === 'user').length;

    return (
        <div className="container py-10 mx-auto px-4 md:px-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        Admin Control Panel
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage platform users, astrologers, and sessions.</p>
                </div>
                <div className="flex gap-4">
                    <Card className="bg-primary/5 border-none shadow-none">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="bg-primary/20 p-2 rounded-lg text-primary"><UserCog size={20} /></div>
                            <div>
                                <p className="text-2xl font-bold leading-none">{astrologersCount}</p>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Astrologers</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/50 border-none shadow-none">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="bg-muted p-2 rounded-lg text-muted-foreground"><User size={20} /></div>
                            <div>
                                <p className="text-2xl font-bold leading-none">{usersCount}</p>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Regular Users</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Promote users to astrologers or revoke access.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading database...</div>
                        ) : (
                            <div className="divide-y overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Platform User</th>
                                            <th className="px-6 py-4 font-medium">Current Role</th>
                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {users.map(userItem => (
                                            <tr key={userItem.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8 border">
                                                            <AvatarFallback>{userItem.email.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-foreground">{userItem.email}</p>
                                                            <p className="text-xs text-muted-foreground">ID: {userItem.id.substring(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={
                                                        userItem.role === 'superadmin' ? 'destructive' :
                                                            userItem.role === 'astrologer' ? 'default' : 'secondary'
                                                    }>
                                                        {userItem.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {userItem.role === 'user' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => promoteToAstrologer(userItem.id, userItem.email)}
                                                            className="shadow-sm"
                                                        >
                                                            <TrendingUp className="w-4 h-4 mr-2" />
                                                            Promote to Astrologer
                                                        </Button>
                                                    )}
                                                    {userItem.role === 'astrologer' && (
                                                        <Button disabled size="sm" variant="outline" className="opacity-50">
                                                            <Video className="w-4 h-4 mr-2" />
                                                            Manage Profile
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
