import React from 'react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';

const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
];

const Navbar = () => {
    const { currentUser, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    async function handleLogout() {
        await logout();
        navigate('/');
    }

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 mx-auto">
                {/* Logo + Language Switcher */}
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2 no-underline">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                            AC
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">AstroCall</span>
                    </Link>

                    {/* Language Switcher */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2">
                                <Globe className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
                                <span className="sm:hidden">{currentLang.flag}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[140px]">
                            {languages.map(lang => (
                                <DropdownMenuItem
                                    key={lang.code}
                                    onClick={() => i18n.changeLanguage(lang.code)}
                                    className={`gap-2 cursor-pointer ${i18n.language === lang.code ? 'bg-accent font-semibold' : ''}`}
                                >
                                    <span>{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Desktop Navigation — only show when logged in */}
                {currentUser && (
                    <div className="hidden md:flex flex-1 items-center justify-center">
                        <NavigationMenu>
                            <NavigationMenuList>
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                        <Link to="/">{t('nav.home')}</Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                        <Link to="/astrologers">{t('nav.astrologers')}</Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                        <Link to="/about">{t('nav.about')}</Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                )}

                {/* Action Buttons & Profile */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {!currentUser ? (
                        <>
                            <Button asChild variant="outline" className="hidden sm:flex">
                                <Link to="/login">{t('nav.login')}</Link>
                            </Button>
                            <Button asChild>
                                <Link to="/login">{t('nav.login')}</Link>
                            </Button>
                        </>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative w-8 h-8 rounded-full">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={currentUser?.photoURL} alt={currentUser?.email} />
                                        <AvatarFallback>{currentUser.email[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {userRole === 'superadmin' ? 'Super Admin' : userRole === 'astrologer' ? t('common.astrologer') : t('common.user')}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {currentUser.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {userRole === 'superadmin' && (
                                    <DropdownMenuItem asChild>
                                        <Link to="/admin-dashboard">{t('nav.dashboard')}</Link>
                                    </DropdownMenuItem>
                                )}
                                {userRole === 'astrologer' && (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link to="/astrologer-dashboard">{t('nav.dashboard')}</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/chat">{t('nav.messages')}</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/astrologer-reviews">{t('nav.myReviews')}</Link>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {userRole === 'user' && (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link to="/user-dashboard">{t('nav.mySessions')}</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/chat">{t('nav.messages')}</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/favorites">{t('nav.myFavorites')}</Link>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuItem asChild>
                                    <Link to="/profile">{t('nav.profile')}</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                                    {t('nav.logout')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Mobile Menu Button */}
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="4" x2="20" y1="12" y2="12" />
                            <line x1="4" x2="20" y1="6" y2="6" />
                            <line x1="4" x2="20" y1="18" y2="18" />
                        </svg>
                    </Button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
