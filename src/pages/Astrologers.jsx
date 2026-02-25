import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Video, Phone, Star, CheckCircle2 } from 'lucide-react';

export default function Astrologers() {
    const [astrologers, setAstrologers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAstrologers() {
            try {
                // Determine online status if specified, else fetch all approved
                // For now, assuming anyone with role="astrologer" in 'users' or 'astrologers' collection is listed.
                // Assuming we use the 'astrologers' collection as planned.
                const q = query(
                    collection(db, 'astrologers'),
                    where('isOnline', '==', true)
                );

                const querySnapshot = await getDocs(q);
                const fetchedAstros = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Fallback mock data for visual testing if DB is empty
                if (fetchedAstros.length === 0) {
                    setAstrologers([
                        {
                            id: 'mock1',
                            name: 'Aacharya Sharma',
                            bio: 'Expert in Vedic Astrology, Vastu, and Numerology with 15+ years of experience guiding souls.',
                            languages: ['English', 'Hindi', 'Sanskrit'],
                            isOnline: true,
                            rating: 4.9,
                            reviews: 1204,
                            hourlyRate: 50
                        },
                        {
                            id: 'mock2',
                            name: 'Tarot Reader Priya',
                            bio: 'Intuitive Tarot reader and energy healer focusing on relationships, career paths, and spiritual growth.',
                            languages: ['English', 'Spanish'],
                            isOnline: true,
                            rating: 4.8,
                            reviews: 856,
                            hourlyRate: 40
                        },
                        {
                            id: 'mock3',
                            name: 'Pandit Verma',
                            bio: 'Renowned expert in Kundli matching, face reading, and remedial astrology. Accurate predictions guaranteed.',
                            languages: ['Hindi', 'Punjabi'],
                            isOnline: true,
                            rating: 5.0,
                            reviews: 3200,
                            hourlyRate: 60
                        }
                    ]);
                } else {
                    setAstrologers(fetchedAstros);
                }
            } catch (error) {
                console.error("Error fetching astrologers:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAstrologers();
    }, []);

    return (
        <div className="container py-10 mx-auto px-4 md:px-8">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl mb-4">
                    Our <span className="text-primary">Online</span> Astrologers
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Connect instantly with verified experts. Choose your preferred astrologer and start a live consultation right now.
                </p>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse h-96 bg-muted/30"></Card>
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {astrologers.map(astro => (
                        <Card key={astro.id} className="overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
                            <CardHeader className="p-6 pb-0 flex flex-row items-start gap-4 space-y-0">
                                <div className="relative">
                                    <Avatar className="w-20 h-20 border-2 border-primary/20">
                                        <AvatarImage src={`https://i.pravatar.cc/150?u=${astro.id}`} />
                                        <AvatarFallback>{astro.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    {astro.isOnline && (
                                        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background"></span>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 pl-2">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <h3 className="font-bold text-lg leading-none">{astro.name}</h3>
                                        <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20" />
                                    </div>
                                    <div className="flex items-center gap-1 text-sm font-medium text-yellow-600 mb-2">
                                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                        <span>{astro.rating || 'New'}</span>
                                        <span className="text-muted-foreground font-normal ml-1">
                                            ({astro.reviews || 0} reviews)
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-primary">
                                        ${astro.hourlyRate || 30}/hr
                                    </p>
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
                                <Button className="flex-1 gap-2 shadow-md shadow-primary/20">
                                    <Video className="w-4 h-4" />
                                    Video Call
                                </Button>
                                <Button variant="outline" className="flex-1 gap-2 bg-muted/10">
                                    <Phone className="w-4 h-4" />
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
