import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Edit3, Save, X } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import {
    getZodiacSign,
    calculatePlanetaryPositions,
    ZODIAC_SIGNS,
    PLANETS,
    ELEMENT_INFO,
} from '@/lib/astrology';

// North Indian Kundli SVG Chart
function KundliChart({ positions }) {
    const size = 320;
    const mid = size / 2;
    const outer = mid - 8;

    // North Indian style: diamond with houses
    // House layout (North Indian):
    //       [12] [1]  [2]
    //   [11]              [3]
    //   [10]              [4]
    //       [9]  [7]  [5]
    //            [8]  [6]
    // The diamond is drawn with diagonals

    // House center positions for text placement
    const houseCenters = {
        1: { x: mid, y: mid * 0.32 },
        2: { x: mid + outer * 0.48, y: mid * 0.32 },
        3: { x: mid + outer * 0.48, y: mid * 0.72 },
        4: { x: mid + outer * 0.48, y: mid * 1.12 },
        5: { x: mid + outer * 0.48, y: mid * 1.52 },
        6: { x: mid, y: mid * 1.52 },
        7: { x: mid, y: mid * 1.12 },
        8: { x: mid, y: mid * 1.68 },
        9: { x: mid - outer * 0.48, y: mid * 1.52 },
        10: { x: mid - outer * 0.48, y: mid * 1.12 },
        11: { x: mid - outer * 0.48, y: mid * 0.72 },
        12: { x: mid - outer * 0.48, y: mid * 0.32 },
    };

    // Group planets by house
    const houseContents = {};
    for (let i = 1; i <= 12; i++) houseContents[i] = [];
    Object.values(positions.positions).forEach(p => {
        houseContents[p.house].push(p);
    });

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] mx-auto">
            <defs>
                <linearGradient id="kundliBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary) / 0.05)" />
                    <stop offset="100%" stopColor="hsl(var(--primary) / 0.12)" />
                </linearGradient>
            </defs>

            {/* Outer square */}
            <rect x="4" y="4" width={size - 8} height={size - 8} rx="4"
                fill="url(#kundliBg)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" />

            {/* Diagonal lines creating houses */}
            <line x1="4" y1="4" x2={mid} y2={mid} stroke="hsl(var(--primary) / 0.25)" strokeWidth="1" />
            <line x1={size - 4} y1="4" x2={mid} y2={mid} stroke="hsl(var(--primary) / 0.25)" strokeWidth="1" />
            <line x1="4" y1={size - 4} x2={mid} y2={mid} stroke="hsl(var(--primary) / 0.25)" strokeWidth="1" />
            <line x1={size - 4} y1={size - 4} x2={mid} y2={mid} stroke="hsl(var(--primary) / 0.25)" strokeWidth="1" />

            {/* Cross lines */}
            <line x1={mid} y1="4" x2={mid} y2={size - 4} stroke="hsl(var(--primary) / 0.25)" strokeWidth="1" />
            <line x1="4" y1={mid} x2={size - 4} y2={mid} stroke="hsl(var(--primary) / 0.25)" strokeWidth="1" />

            {/* House numbers */}
            {Object.entries(houseCenters).map(([house, pos]) => (
                <g key={`house-${house}`}>
                    <text
                        x={pos.x}
                        y={pos.y - 12}
                        textAnchor="middle"
                        className="fill-muted-foreground"
                        fontSize="9"
                        fontWeight="500"
                        opacity="0.5"
                    >
                        H{house}
                    </text>
                    {/* Planets in this house */}
                    {houseContents[house].map((planet, idx) => (
                        <text
                            key={planet.id}
                            x={pos.x + (idx % 3 - 1) * 24}
                            y={pos.y + 4 + Math.floor(idx / 3) * 14}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill={planet.color}
                        >
                            {planet.id}
                        </text>
                    ))}
                </g>
            ))}

            {/* Ascendant marker */}
            <text x={mid} y={mid * 0.15} textAnchor="middle"
                fontSize="10" fontWeight="700" className="fill-primary">
                ASC: {positions.ascendantSign.symbol} {positions.ascendantSign.name.charAt(0).toUpperCase() + positions.ascendantSign.name.slice(1)}
            </text>
        </svg>
    );
}

// Planet Legend
function PlanetLegend({ positions }) {
    return (
        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs mt-3">
            {Object.values(positions.positions).map(p => (
                <div key={p.id} className="flex items-center gap-1.5">
                    <span className="font-bold" style={{ color: p.color }}>{p.id}</span>
                    <span className="text-muted-foreground truncate">
                        {p.sign.charAt(0).toUpperCase() + p.sign.slice(1)}
                    </span>
                </div>
            ))}
        </div>
    );
}

// Main BirthChart component
export default function BirthChart({ birthDetails, userId, onSave }) {
    const [editing, setEditing] = useState(!birthDetails);
    const [dateOfBirth, setDateOfBirth] = useState(birthDetails?.dateOfBirth || '');
    const [timeOfBirth, setTimeOfBirth] = useState(birthDetails?.timeOfBirth || '12:00');
    const [placeOfBirth, setPlaceOfBirth] = useState(birthDetails?.placeOfBirth || '');
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (!dateOfBirth) {
            toast('Please enter your date of birth', {
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
            return;
        }

        setSaving(true);
        try {
            const zodiac = getZodiacSign(dateOfBirth);
            const details = {
                dateOfBirth,
                timeOfBirth: timeOfBirth || '12:00',
                placeOfBirth: placeOfBirth.trim() || 'Unknown',
                zodiacSign: zodiac.name,
                savedAt: serverTimestamp(),
            };

            await updateDoc(doc(db, 'users', userId), {
                birthDetails: details,
            });

            toast('Birth details saved! ✨', {
                style: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
            });

            setEditing(false);
            if (onSave) onSave(details);
        } catch (err) {
            console.error('Error saving birth details:', err);
            toast('Failed to save birth details', {
                style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
            });
        } finally {
            setSaving(false);
        }
    }

    // If editing or no birth details, show form
    if (editing || !birthDetails) {
        return (
            <Card className="overflow-hidden border-primary/20 shadow-sm">
                <CardHeader className="pb-3 bg-gradient-to-r from-violet-50/80 to-indigo-50/50 dark:from-violet-500/10 dark:to-indigo-500/5">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        Birth Chart (Kundli)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-5">
                        Enter your birth details to generate your personalized Kundli chart and daily horoscope.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                Date of Birth *
                            </label>
                            <Input
                                type="date"
                                value={dateOfBirth}
                                onChange={e => setDateOfBirth(e.target.value)}
                                className="h-10"
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                Time of Birth
                            </label>
                            <Input
                                type="time"
                                value={timeOfBirth}
                                onChange={e => setTimeOfBirth(e.target.value)}
                                className="h-10"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                Place of Birth
                            </label>
                            <Input
                                type="text"
                                placeholder="e.g., Mumbai"
                                value={placeOfBirth}
                                onChange={e => setPlaceOfBirth(e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-5">
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Generate Chart
                        </Button>
                        {birthDetails && (
                            <Button variant="ghost" size="sm" onClick={() => {
                                setEditing(false);
                                setDateOfBirth(birthDetails.dateOfBirth);
                                setTimeOfBirth(birthDetails.timeOfBirth);
                                setPlaceOfBirth(birthDetails.placeOfBirth);
                            }}>
                                <X className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show the chart
    const zodiac = getZodiacSign(birthDetails.dateOfBirth);
    const positions = calculatePlanetaryPositions(birthDetails.dateOfBirth, birthDetails.timeOfBirth);
    const elementInfo = ELEMENT_INFO[zodiac.element];

    return (
        <Card className="overflow-hidden border-primary/20 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-violet-50/80 to-indigo-50/50 dark:from-violet-500/10 dark:to-indigo-500/5">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        Birth Chart (Kundli)
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 text-muted-foreground"
                        onClick={() => setEditing(true)}>
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left: Zodiac Info */}
                    <div className="space-y-4">
                        {/* Zodiac Sign Card */}
                        <div className="flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-br from-background to-muted/30">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                                style={{ backgroundColor: zodiac.color + '18', border: `1px solid ${zodiac.color}30` }}>
                                {zodiac.emoji}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground capitalize">{zodiac.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {zodiac.symbol} · {elementInfo.emoji} {zodiac.element} Sign
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Ruler: {zodiac.ruler}
                                </p>
                            </div>
                        </div>

                        {/* Birth Details */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-1.5 border-b border-dashed">
                                <span className="text-muted-foreground">Date of Birth</span>
                                <span className="font-medium text-foreground">
                                    {new Date(birthDetails.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-dashed">
                                <span className="text-muted-foreground">Time</span>
                                <span className="font-medium text-foreground">{birthDetails.timeOfBirth}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-dashed">
                                <span className="text-muted-foreground">Place</span>
                                <span className="font-medium text-foreground">{birthDetails.placeOfBirth}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-dashed">
                                <span className="text-muted-foreground">Element</span>
                                <Badge variant="secondary" className="text-xs gap-1">
                                    {elementInfo.emoji} {zodiac.element}
                                </Badge>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-muted-foreground">Ascendant</span>
                                <span className="font-medium text-foreground capitalize">
                                    {positions.ascendantSign.symbol} {positions.ascendantSign.name}
                                </span>
                            </div>
                        </div>

                        {/* Element traits */}
                        <p className="text-xs text-muted-foreground italic px-1">
                            {elementInfo.emoji} {zodiac.element} signs are known for being {elementInfo.traits.toLowerCase()}.
                        </p>
                    </div>

                    {/* Right: Kundli Chart */}
                    <div>
                        <KundliChart positions={positions} />
                        <PlanetLegend positions={positions} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
