import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDailyPanchang } from '@/lib/astrology';

export default function DailyPanchang() {
    const panchang = useMemo(() => getDailyPanchang(new Date()), []);

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-yellow-50/40 dark:from-amber-500/5 dark:via-orange-500/5 dark:to-yellow-500/5 dark:border-amber-500/20">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-foreground">
                            Daily Panchang
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{today}</p>
                    </div>
                    {panchang.isAuspicious ? (
                        <Badge className="bg-green-100 text-foreground border-green-200 dark:bg-green-500/10 dark:border-green-500/20 text-[10px]">
                            Shubh Din
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-amber-200">
                            Cautious Day
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Main Info Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                    <InfoBox label="Vaar" value={panchang.vaar} />
                    <InfoBox label="Tithi" value={`${panchang.paksha.name} — ${panchang.tithi}`} />
                    <InfoBox label="Nakshatra" value={panchang.nakshatra} />
                    <InfoBox label="Yoga" value={panchang.yoga} />
                    <InfoBox label="Karana" value={panchang.karana} />
                    <InfoBox
                        label="Rahu Kaal"
                        value={panchang.rahuKaal}
                        className="bg-red-50/70 border-red-200/60 dark:bg-red-500/5 dark:border-red-500/15"
                    />
                </div>

                {/* Sun & Moon Times */}
                <div className="flex items-center gap-4 justify-center py-2 text-xs font-medium text-muted-foreground">
                    <div>
                        <span className="text-foreground mr-1">Sunrise:</span> {panchang.sunrise}
                    </div>
                    <span className="text-muted-foreground/30">•</span>
                    <div>
                        <span className="text-foreground mr-1">Sunset:</span> {panchang.sunset}
                    </div>
                    <span className="text-muted-foreground/30">•</span>
                    <div>
                        <span className="text-foreground mr-1">Moonrise:</span> {panchang.moonrise}
                    </div>
                </div>

                {/* Shubh Muhurats */}
                <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                        Shubh Muhurats
                    </h4>
                    <div className="space-y-2">
                        {panchang.shubhMuhurats.map((m, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/60 border border-amber-100 dark:border-amber-500/10 text-xs">
                                <div>
                                    <span className="font-semibold text-foreground">{m.name}</span>
                                    <span className="text-muted-foreground ml-2 hidden sm:inline">— {m.desc}</span>
                                </div>
                                <div className="font-medium text-foreground shrink-0">
                                    {m.time}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Paksha Note */}
                <p className="text-[11px] text-center text-slate-500 font-medium italic">
                    {panchang.paksha.desc}
                </p>
            </CardContent>
        </Card>
    );
}

function InfoBox({ label, value, className = '' }) {
    return (
        <div className={`p-3 rounded-xl border bg-background/50 flex flex-col items-start ${className}`}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{label}</p>
            <p className="text-xs font-semibold text-foreground leading-snug">{value}</p>
        </div>
    );
}
