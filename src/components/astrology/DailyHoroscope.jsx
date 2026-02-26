import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, Heart, Briefcase, Activity, Sparkles } from 'lucide-react';
import { getDailyHoroscope, getZodiacSign, ZODIAC_SIGNS } from '@/lib/astrology';

function MoodBar({ score }) {
    const getColor = (s) => {
        if (s >= 85) return 'bg-green-500';
        if (s >= 70) return 'bg-emerald-500';
        if (s >= 55) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${getColor(score)}`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <span className="text-xs font-bold text-foreground min-w-[32px]">{score}%</span>
        </div>
    );
}

function HoroscopeCategory({ icon: Icon, label, text, color }) {
    return (
        <div className="p-3.5 rounded-xl border bg-gradient-to-br from-background to-muted/20 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
        </div>
    );
}

export default function DailyHoroscope({ birthDetails }) {
    if (!birthDetails) return null;

    const zodiac = getZodiacSign(birthDetails.dateOfBirth);
    const horoscope = getDailyHoroscope(zodiac);
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Card className="overflow-hidden border-amber-200/50 dark:border-amber-500/20 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-amber-50/80 to-orange-50/50 dark:from-amber-500/10 dark:to-orange-500/5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        Daily Horoscope
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400 gap-1">
                            {zodiac.emoji} {zodiac.name.charAt(0).toUpperCase() + zodiac.name.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{dateStr}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
                {/* General Horoscope */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50/60 to-orange-50/30 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-100 dark:border-amber-500/10">
                    <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground leading-relaxed font-medium">
                        {horoscope.general}
                    </p>
                </div>

                {/* Mood Score */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's Mood</span>
                    </div>
                    <MoodBar score={horoscope.moodScore} />
                </div>

                {/* Category Cards */}
                <div className="grid sm:grid-cols-3 gap-3">
                    <HoroscopeCategory
                        icon={Heart}
                        label="Love"
                        text={horoscope.love}
                        color="bg-rose-500"
                    />
                    <HoroscopeCategory
                        icon={Briefcase}
                        label="Career"
                        text={horoscope.career}
                        color="bg-blue-600"
                    />
                    <HoroscopeCategory
                        icon={Activity}
                        label="Health"
                        text={horoscope.health}
                        color="bg-emerald-600"
                    />
                </div>

                {/* Lucky Info */}
                <div className="flex flex-wrap gap-3 pt-1">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Lucky Number:</span>
                        <Badge variant="secondary" className="font-bold text-xs">{horoscope.luckyNumber}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Lucky Color:</span>
                        <Badge variant="secondary" className="font-bold text-xs">{horoscope.luckyColor}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Compatible Sign:</span>
                        <Badge variant="secondary" className="font-bold text-xs capitalize">{horoscope.compatibility}</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
