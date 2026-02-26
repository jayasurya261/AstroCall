import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="w-full bg-muted/50 border-t pb-8 pt-16 mt-auto">
            <div className="container px-4 mx-auto md:px-8">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8 lg:gap-12 mb-16">

                    {/* Brand Column */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                                AC
                            </div>
                            <span className="text-xl font-bold tracking-tight">AstroCall</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            {t('footer.brandDesc')}
                        </p>
                        <div className="flex items-center gap-3">
                            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                <Twitter className="w-5 h-5" />
                                <span className="sr-only">Twitter</span>
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                <Instagram className="w-5 h-5" />
                                <span className="sr-only">Instagram</span>
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                <Linkedin className="w-5 h-5" />
                                <span className="sr-only">LinkedIn</span>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">{t('footer.platform')}</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link to="/astrologers" className="hover:text-primary transition-colors">{t('footer.findAstrologer')}</Link></li>
                            <li><Link to="/call-logs" className="hover:text-primary transition-colors">{t('footer.callHistory')}</Link></li>
                            <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.howItWorks')}</Link></li>
                            <li><Link to="/login" className="hover:text-primary transition-colors">{t('footer.pricing')}</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">{t('footer.support')}</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.helpCenter')}</Link></li>
                            <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.safetyGuidelines')}</Link></li>
                            <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.termsOfService')}</Link></li>
                            <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.privacyPolicy')}</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">{t('footer.contactUs')}</h3>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                                <span>support@astrocall.com</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Phone className="w-4 h-4 mt-0.5 text-primary" />
                                <span>+1 (555) 000-0000</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                                <span>
                                    123 Astral Way<br />
                                    Suite 100<br />
                                    New York, NY 10001
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between pt-8 border-t md:flex-row gap-4">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} {t('footer.allRightsReserved')}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Link to="/about" className="hover:text-primary transition-colors">{t('footer.terms')}</Link>
                        <Link to="/about" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link>
                        <Link to="/about" className="hover:text-primary transition-colors">{t('footer.cookies')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
