import React from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Video,
    Phone,
    Star,
    ShieldCheck,
    Sparkles,
    CalendarCheck
} from "lucide-react";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">

            {/* Hero Section */}
            <section className="relative px-4 pt-20 pb-32 overflow-hidden bg-background md:px-8">
                <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-background to-background"></div>
                <div className="container relative z-10 flex flex-col items-center mx-auto text-center">
                    <Badge variant="secondary" className="px-3 py-1 mb-6 text-sm font-medium tracking-wide text-primary bg-primary/10 border-primary/20">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Live Astrology Consultations
                    </Badge>
                    <h1 className="max-w-4xl mb-6 text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl text-foreground">
                        Find Clarity with <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
                            AstroCall
                        </span>
                    </h1>
                    <p className="max-w-2xl mb-10 text-lg md:text-xl text-muted-foreground">
                        Connect instantly with verified, top-rated astrologers through seamless high-quality video and voice calls. Uncover what the stars hold for you today.
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Button asChild size="lg" className="h-14 px-8 text-base shadow-lg shadow-primary/25">
                            <Link to="/astrologers">
                                <Video className="w-5 h-5 mr-2" />
                                Start a Live Call
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base bg-background/50 backdrop-blur-sm border-2">
                            <Link to="/about">
                                How it Works
                            </Link>
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex items-center justify-center gap-6 mt-16 text-sm font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <span>100% Verified Astrologers</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            <span>4.9/5 User Rating</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-muted/30">
                <div className="container px-4 mx-auto md:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold md:text-4xl text-foreground">Why Choose AstroCall?</h2>
                        <p className="mt-4 text-muted-foreground text-lg">Experience consultations like never before with our cutting-edge platform.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <Card className="border-none shadow-md bg-background/60 backdrop-blur aspect-auto">
                            <CardHeader>
                                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-primary/10 text-primary">
                                    <Video className="w-6 h-6" />
                                </div>
                                <CardTitle>Seamless Video</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    Crystal clear face-to-face sessions that create a deeply personal and engaging consultation experience.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-none shadow-md bg-background/60 backdrop-blur aspect-auto">
                            <CardHeader>
                                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-primary/10 text-primary">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <CardTitle>Instant Voice Calls</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    Need quick advice? Connect immediately over pristine voice channels, anytime and anywhere.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-none shadow-md bg-background/60 backdrop-blur aspect-auto">
                            <CardHeader>
                                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-primary/10 text-primary">
                                    <CalendarCheck className="w-6 h-6" />
                                </div>
                                <CardTitle>Easy Scheduling</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    Book sessions in advance or jump into a live queue—getting spiritual guidance has never been simpler.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Testimonials / Social Proof */}
            <section className="py-24">
                <div className="container px-4 mx-auto md:px-8 text-center">
                    <h2 className="text-3xl font-bold md:text-4xl text-foreground mb-12">Trusted by Thousands</h2>
                    <div className="flex flex-wrap justify-center gap-8">
                        <Card className="w-full max-w-sm text-left border-muted">
                            <CardContent className="pt-6">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    ))}
                                </div>
                                <p className="mb-6 text-muted-foreground italic">"The video call quality was incredible. It felt like the astrologer was right there in the room with me. Best reading I've ever had."</p>
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src="https://i.pravatar.cc/150?img=47" />
                                        <AvatarFallback>SJ</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">Sarah Jenkins</p>
                                        <p className="text-xs text-muted-foreground">Premium User</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="w-full max-w-sm text-left border-muted">
                            <CardContent className="pt-6">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    ))}
                                </div>
                                <p className="mb-6 text-muted-foreground italic">"I love how quick and easy it is to find someone online. The voice call connected instantly and the advice was spot on!"</p>
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src="https://i.pravatar.cc/150?img=11" />
                                        <AvatarFallback>MK</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">Michael K.</p>
                                        <p className="text-xs text-muted-foreground">Regular Caller</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary/5 border-t border-primary/10">
                <div className="container px-4 mx-auto text-center md:px-8">
                    <h2 className="text-3xl font-bold md:text-4xl text-foreground mb-6">Ready to Discover Your Path?</h2>
                    <p className="max-w-xl mx-auto mb-8 text-lg text-muted-foreground">Join AstroCall today and get your first 5 minutes free with any premium astrologer.</p>
                    <Button asChild size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20">
                        <Link to="/login">Create Free Account</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
