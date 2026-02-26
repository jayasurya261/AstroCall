import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Shield, Users, Globe, Heart, Zap, Phone, Video } from 'lucide-react';

export default function About() {
    return (
        <div className="container py-12 mx-auto px-4 md:px-8 max-w-4xl">

            {/* Page Header */}
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl mb-4">
                    About <span className="text-primary">AstroCall</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Bridging the ancient wisdom of astrology with modern technology to bring you meaningful, personalized guidance — anytime, anywhere.
                </p>
            </div>

            {/* Our Story */}
            <section className="mb-14">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-primary" />
                    Our Story
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                        AstroCall was born from a simple idea — what if anyone, regardless of where they live, could speak directly with a trusted, experienced astrologer in real time? Traditional astrology consultations required visiting a practitioner in person, often involving long travel and scheduling hassles. We wanted to change that.
                    </p>
                    <p>
                        Founded in 2025, AstroCall set out to create a seamless digital platform where seekers of cosmic guidance can instantly connect with verified astrologers through high-quality video and voice calls. Whether you're looking for clarity on your career, relationships, health, or spiritual journey, our platform connects you with the right expert in minutes — not days.
                    </p>
                    <p>
                        Today, AstroCall serves thousands of users every month, with a growing community of professional astrologers from across India and beyond. Our mission remains unchanged: to make authentic, life-changing astrological guidance accessible to everyone.
                    </p>
                </div>
            </section>

            {/* What We Offer */}
            <section className="mb-14">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-primary" />
                    What We Offer
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                        AstroCall is more than just a calling platform — it's a complete ecosystem designed around your spiritual needs.
                    </p>
                    <ul className="list-disc list-inside space-y-3 ml-2">
                        <li>
                            <strong className="text-foreground">Live Video Consultations</strong> — Face-to-face sessions with astrologers using crystal-clear video powered by LiveKit technology. See their charts, follow along in real time, and experience a personal connection.
                        </li>
                        <li>
                            <strong className="text-foreground">Instant Voice Calls</strong> — Need quick advice on the go? Our voice call feature connects you to an available astrologer within seconds, so you never have to wait when the stars are speaking.
                        </li>
                        <li>
                            <strong className="text-foreground">Verified Expert Astrologers</strong> — Every astrologer on our platform goes through a rigorous verification process. We check their credentials, experience, and expertise before they can take calls, ensuring you always get quality guidance.
                        </li>
                        <li>
                            <strong className="text-foreground">Transparent Ratings & Reviews</strong> — After every session, users can rate and review their astrologer. These reviews are publicly visible on each astrologer's profile, helping you choose the best practitioner for your needs.
                        </li>
                        <li>
                            <strong className="text-foreground">Real-Time Availability</strong> — See which astrologers are online right now. No scheduling, no waiting rooms. When an astrologer is green, you can book instantly and get on a call within minutes.
                        </li>
                        <li>
                            <strong className="text-foreground">Session History & Dashboard</strong> — Your complete consultation history is saved on your dashboard. Review past sessions, re-read your notes, and track your astrological journey over time.
                        </li>
                    </ul>
                </div>
            </section>

            {/* How It Works */}
            <section className="mb-14">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Globe className="w-6 h-6 text-primary" />
                    How It Works
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>Getting started with AstroCall is simple. Here's how it works:</p>
                    <ol className="list-decimal list-inside space-y-3 ml-2">
                        <li>
                            <strong className="text-foreground">Create Your Account</strong> — Sign up for free using your email or Google account. Choose whether you want to join as a user seeking guidance or as an astrologer offering consultations.
                        </li>
                        <li>
                            <strong className="text-foreground">Browse Astrologers</strong> — Explore our directory of verified astrologers. Each profile shows their specializations, languages spoken, hourly rate, ratings, and real-time online status.
                        </li>
                        <li>
                            <strong className="text-foreground">Book a Session</strong> — Found the right astrologer? Click "Video Call" or "Voice Call" to send a booking request. If the astrologer is online, they'll see your request instantly.
                        </li>
                        <li>
                            <strong className="text-foreground">Astrologer Accepts</strong> — Once the astrologer accepts your request, both of you are connected to a private, secure call room. No downloads or external apps needed — everything happens right in your browser.
                        </li>
                        <li>
                            <strong className="text-foreground">Have Your Session</strong> — Enjoy your consultation with crystal-clear audio and video. Discuss your birth chart, ask about upcoming transits, or seek guidance on life decisions.
                        </li>
                        <li>
                            <strong className="text-foreground">Leave a Review</strong> — After the session ends, head to your dashboard and rate your experience. Your honest feedback helps other users find the best astrologers and helps practitioners improve their services.
                        </li>
                    </ol>
                </div>
            </section>

            {/* For Astrologers */}
            <section className="mb-14">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Star className="w-6 h-6 text-primary" />
                    For Astrologers
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                        Are you a practicing astrologer looking to expand your reach? AstroCall gives you a powerful platform to connect with clients worldwide without worrying about marketing, scheduling, or technical infrastructure.
                    </p>
                    <ul className="list-disc list-inside space-y-3 ml-2">
                        <li>
                            <strong className="text-foreground">Set Your Own Rates</strong> — You're in control. Set your hourly rate and adjust it anytime from your dashboard.
                        </li>
                        <li>
                            <strong className="text-foreground">Go Online When You Want</strong> — Toggle your availability on and off with a single click. Work on your schedule, whether that's mornings, evenings, or weekends.
                        </li>
                        <li>
                            <strong className="text-foreground">Accept or Decline Bookings</strong> — Every incoming booking request is yours to accept or decline. You maintain full control over your consultations.
                        </li>
                        <li>
                            <strong className="text-foreground">Build Your Reputation</strong> — As clients leave reviews and ratings, your profile becomes stronger. High-rated astrologers naturally attract more bookings.
                        </li>
                        <li>
                            <strong className="text-foreground">Dedicated Dashboard</strong> — Track your sessions, view your reviews, monitor earnings, and manage your profile — all from one clean, intuitive dashboard.
                        </li>
                    </ul>
                    <p>
                        Joining AstroCall as an astrologer is completely free. Simply sign up, set up your profile with your bio and languages, and start accepting calls.
                    </p>
                </div>
            </section>

            {/* Our Values */}
            <section className="mb-14">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    Our Values
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <ul className="list-disc list-inside space-y-3 ml-2">
                        <li>
                            <strong className="text-foreground">Trust & Verification</strong> — We verify every astrologer on our platform. Your safety and trust are our highest priority. We never compromise on quality.
                        </li>
                        <li>
                            <strong className="text-foreground">Privacy & Security</strong> — All calls on AstroCall are private and encrypted. Your personal information and consultation details are never shared with third parties.
                        </li>
                        <li>
                            <strong className="text-foreground">Accessibility</strong> — Astrology should be available to everyone, not just those who live near a practitioner. AstroCall breaks geographical barriers and brings world-class astrologers to your screen.
                        </li>
                        <li>
                            <strong className="text-foreground">Transparency</strong> — Clear pricing, honest reviews, and no hidden fees. What you see is what you get.
                        </li>
                        <li>
                            <strong className="text-foreground">Community</strong> — We believe in building a vibrant community of seekers and practitioners who support and learn from each other.
                        </li>
                    </ul>
                </div>
            </section>

            {/* Technology */}
            <section className="mb-14">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Video className="w-6 h-6 text-primary" />
                    Our Technology
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                        AstroCall is built with cutting-edge technology to ensure the best possible experience for both users and astrologers:
                    </p>
                    <ul className="list-disc list-inside space-y-3 ml-2">
                        <li>
                            <strong className="text-foreground">LiveKit-Powered Calls</strong> — We use LiveKit, an enterprise-grade WebRTC framework, to deliver ultra-low-latency video and voice calls. No lag, no buffering, just smooth real-time communication.
                        </li>
                        <li>
                            <strong className="text-foreground">Firebase Backend</strong> — Our platform runs on Google Firebase, providing real-time data synchronization, secure authentication, and 99.99% uptime reliability.
                        </li>
                        <li>
                            <strong className="text-foreground">Modern React Frontend</strong> — A fast, responsive single-page application that works flawlessly on desktop and mobile browsers. No app downloads required.
                        </li>
                        <li>
                            <strong className="text-foreground">Dark Mode</strong> — Easy on the eyes during late-night consultations. Toggle between light and dark themes anytime.
                        </li>
                    </ul>
                </div>
            </section>

            {/* Contact / CTA */}
            <section className="text-center py-12 border-t border-border">
                <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Begin Your Journey?</h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                    Whether you're seeking answers from the cosmos or you're an astrologer ready to share your wisdom — AstroCall is the platform for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="h-12 px-8 shadow-lg shadow-primary/20">
                        <Link to="/astrologers">
                            <Phone className="w-5 h-5 mr-2" />
                            Find an Astrologer
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-12 px-8">
                        <Link to="/login">
                            <Users className="w-5 h-5 mr-2" />
                            Join as Astrologer
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
