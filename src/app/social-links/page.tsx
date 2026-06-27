
"use client";

import Navbar from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Instagram, 
  Youtube, 
  MessageCircle, 
  Twitter, 
  Mail, 
  Phone, 
  Music2, 
  Loader2, 
  ChevronLeft,
  Share2,
  Globe
} from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { cn } from "@/lib/utils";

const PLATFORMS: Record<string, any> = {
  instagram: { name: "انستقرام", icon: Instagram, color: "bg-pink-600", light: "bg-pink-50 text-pink-600" },
  youtube: { name: "يوتيوب", icon: Youtube, color: "bg-red-600", light: "bg-red-50 text-red-600" },
  tiktok: { name: "تيك توك", icon: Music2, color: "bg-black", light: "bg-gray-100 text-black" },
  whatsapp: { name: "واتساب", icon: MessageCircle, color: "bg-green-600", light: "bg-green-50 text-green-600" },
  twitter: { name: "إكس (تويتر)", icon: Twitter, color: "bg-blue-400", light: "bg-blue-50 text-blue-400" },
  email: { name: "البريد الإلكتروني", icon: Mail, color: "bg-primary", light: "bg-primary/10 text-primary" },
  phone: { name: "رقم الهاتف", icon: Phone, color: "bg-secondary", light: "bg-secondary/10 text-secondary" },
};

export default function SocialLinksPublicPage() {
  const db = useFirestore();
  const socialQuery = useMemoFirebase(() => db ? query(collection(db, "socialLinks"), orderBy("order", "asc")) : null, [db]);
  const { data: links, loading } = useCollection(socialQuery);

  const handleLinkClick = (url: string, platform: string) => {
    let finalUrl = url;
    if (platform === "email" && !url.startsWith("mailto:")) finalUrl = `mailto:${url}`;
    if (platform === "phone" && !url.startsWith("tel:")) finalUrl = `tel:${url}`;
    window.open(finalUrl, "_blank");
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-3xl">
        <header className="text-center space-y-6 mb-16 animate-in fade-in slide-in-from-top-6 duration-700">
          <div className="w-24 h-24 bg-secondary/10 rounded-[2rem] flex items-center justify-center mx-auto text-secondary luxury-shadow border border-secondary/5 mb-6">
             <Share2 className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black font-headline text-primary">حسابات سراج الرسمية</h1>
            <p className="text-muted-foreground text-sm md:text-lg max-w-md mx-auto font-medium">
              تواصل معنا عبر منصاتنا الرسمية لمتابعة كل جديد والحصول على الدعم التقني والاستشارات.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary opacity-50" />
          </div>
        ) : links && links.length > 0 ? (
          <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {links.map((link: any) => {
              const platformInfo = PLATFORMS[link.platform] || { name: link.label, icon: Globe, light: "bg-muted text-primary" };
              const Icon = platformInfo.icon;

              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.url, link.platform)}
                  className="group w-full bg-white hover:bg-primary/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] luxury-shadow border border-primary/5 flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-sm", platformInfo.light)}>
                      <Icon className="w-7 h-7 md:w-8 md:h-8" />
                    </div>
                    <div className="text-right">
                      <h3 className="text-base md:text-xl font-black text-primary group-hover:text-secondary transition-colors">{link.label}</h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground font-bold mt-0.5">{platformInfo.name}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-secondary group-hover:text-white transition-all">
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-card/50 rounded-[2.5rem] border-2 border-dashed border-primary/10">
            <p className="text-muted-foreground font-bold">يتم تحديث قائمة الحسابات حالياً...</p>
          </div>
        )}

        <footer className="mt-20 text-center space-y-4 opacity-50">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">siraj.io • 2024</p>
        </footer>
      </div>
    </div>
  );
}
