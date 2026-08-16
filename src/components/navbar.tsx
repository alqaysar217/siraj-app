
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  User, 
  LogIn, 
  LayoutDashboard, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  Home, 
  ChevronUp, 
  ChevronDown,
  Users,
  TrendingUp,
  GraduationCap,
  UsersRound,
  MessageSquare,
  CreditCard,
  BarChart3,
  X,
  KeyRound,
  Library,
  Award,
  SearchCheck,
  Trophy,
  Settings2,
  Share2,
  Trash2,
  ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/firebase/auth/use-user";
import { useAuth } from "@/firebase/provider";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, profile, loading, isAdmin } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/");
    }
  };

  const studentLinks = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "تصفح الدورات", href: "/courses", icon: GraduationCap },
    { name: "المكتبة العلمية", href: "/books", icon: Library },
    { name: "التعرف على المدربين", href: "/instructors", icon: UsersRound },
    { name: "نخبة الطلاب", href: "/leaderboard", icon: Trophy, authRequired: true },
    { name: "حسابات التواصل", href: "/social-links", icon: Share2 },
    { name: "التحقق من الشهادة", href: "/verify-certificate", icon: SearchCheck },
    { name: "مساحتي التعليمية", href: "/dashboard", icon: LayoutDashboard, authRequired: true },
  ];

  const adminLinks = [
    { name: "لوحة التحكم", href: "/admin/dashboard", icon: ShieldCheck },
    { name: "إدارة الدورات", href: "/admin/manage-courses", icon: GraduationCap },
    { name: "إدارة الكتب", href: "/admin/manage-books", icon: Library },
    { name: "إصدار الشهادات", href: "/admin/certificates", icon: Award },
    { name: "إدارة المدربين", href: "/admin/manage-instructors", icon: UsersRound },
    { name: "إدارة المنهج", href: "/admin/add-lesson", icon: Settings2 },
    { name: "درجات الواتساب", href: "/admin/whatsapp-grades", icon: ClipboardCheck },
    { name: "إدارة الطلاب", href: "/admin/manage-users", icon: Users },
    { name: "إدارة حسابات التواصل", href: "/admin/social-links", icon: Share2 },
    { name: "الأمان والحسابات", href: "/admin/accounts", icon: KeyRound },
    { name: "مراجعات الطلاب", href: "/admin/manage-reviews", icon: MessageSquare },
    { name: "الحسابات البنكية", href: "/admin/bank-accounts", icon: CreditCard },
    { name: "التقارير المالية", href: "/admin/reports", icon: BarChart3 },
    { name: "تقدم المتصدرين", href: "/admin/progress", icon: TrendingUp },
    { name: "سلة المهملات", href: "/admin/trash", icon: Trash2 },
  ];

  return (
    <nav className="glass-nav px-4 py-3 sticky top-0 z-50" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-bold font-headline tracking-tight text-primary">
              سراج
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {!loading && !user && (
              <Button asChild variant="ghost" className="rounded-xl font-bold hidden sm:flex text-primary">
                <Link href="/auth/login">دخول الطلاب</Link>
              </Button>
            )}

            <Sheet dir="rtl">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                  <Menu className="w-6 h-6 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[280px] sm:w-[320px] p-0 flex flex-col border-l-0 bg-background/95 backdrop-blur-xl"
              >
                <SheetHeader className="p-5 text-right border-b border-border/40 relative bg-muted/20">
                   <SheetClose asChild className="absolute left-4 top-1/2 -translate-y-1/2 z-50">
                        <div className="p-2 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all cursor-pointer">
                          <X className="w-5 h-5 text-primary" />
                        </div>
                   </SheetClose>
                  <SheetTitle className="text-xl font-headline text-primary flex items-center gap-3">
                    <div className="relative w-8 h-8">
                      <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                    </div>
                    <span className="font-black">منصة سراج</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-none">
                  {isAdmin ? (
                    <div className="px-3 space-y-1">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] px-4 mb-3">إدارة المنصة</p>
                      {adminLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                          <SheetClose key={link.name} asChild>
                            <Button
                              variant="ghost"
                              asChild
                              className={cn(
                                "w-full justify-start gap-4 h-12 rounded-2xl text-right font-bold transition-all border border-transparent",
                                isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-primary hover:bg-primary/5"
                              )}
                            >
                              <Link href={link.href}>
                                <link.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-secondary")} />
                                <span>{link.name}</span>
                              </Link>
                            </Button>
                          </SheetClose>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3 space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-4 mb-3">أقسام المنصة</p>
                      {studentLinks.map((link) => {
                        if (link.authRequired && !user) return null;
                        const isActive = pathname === link.href;
                        return (
                          <SheetClose key={link.name} asChild>
                            <Button
                              variant="ghost"
                              asChild
                              className={cn(
                                "w-full justify-start gap-4 h-12 rounded-2xl text-right font-bold transition-all border border-transparent",
                                isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-primary hover:bg-primary/5"
                              )}
                            >
                              <Link href={link.href}>
                                <link.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-secondary")} />
                                <span>{link.name}</span>
                              </Link>
                            </Button>
                          </SheetClose>
                        );
                      })}
                    </div>
                  )}

                  {!user && (
                    <div className="px-4 pt-4">
                      <SheetClose asChild>
                        <Button asChild className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/10">
                          <Link href="/auth/login" className="flex items-center gap-2">
                            <LogIn className="w-5 h-5" />
                            تسجيل الدخول
                          </Link>
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </div>

                {user && (
                  <div className="mt-auto border-t border-border/40 bg-muted/30 p-4">
                    {showUserMenu && (
                      <div className="mb-3 space-y-1 animate-in slide-in-from-bottom-4 duration-300">
                        <SheetClose asChild>
                          <Button 
                            asChild
                            variant="ghost" 
                            className="w-full justify-start gap-3 h-12 rounded-xl text-primary hover:bg-white font-bold"
                          >
                            <Link href="/profile">
                              <div className="p-1.5 bg-secondary/10 rounded-lg"><User className="w-4 h-4 text-secondary" /></div>
                              <span className="text-sm">ملفي الشخصي</span>
                            </Link>
                          </Button>
                        </SheetClose>
                        <Button 
                          onClick={handleLogout} 
                          variant="ghost" 
                          className="w-full justify-start gap-3 h-12 rounded-xl text-destructive hover:bg-red-50 font-bold"
                        >
                          <div className="p-1.5 bg-destructive/10 rounded-lg"><LogOut className="w-4 h-4 text-destructive" /></div>
                          <span className="text-sm">تسجيل الخروج</span>
                        </Button>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl transition-all flex-row-reverse group",
                        showUserMenu ? "bg-white shadow-xl scale-[1.02]" : "hover:bg-white/50"
                      )}
                    >
                      <Avatar className="h-12 w-12 border-2 border-white shadow-md shrink-0 transition-transform group-hover:scale-105">
                        <AvatarImage src={profile?.photoURL || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary text-white font-black">
                          {profile?.name?.charAt(0) || "س"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 overflow-hidden text-right">
                        <p className="text-sm font-black text-primary truncate leading-tight">{profile?.name || "مستخدم سراج"}</p>
                        <p className="text-[10px] text-muted-foreground truncate font-medium mt-0.5">{profile?.email}</p>
                      </div>

                      <div className="shrink-0 p-1">
                        {showUserMenu ? (
                          <ChevronDown className="w-5 h-5 text-secondary animate-bounce-subtle" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-muted-foreground opacity-50 group-hover:opacity-100" />
                        )}
                      </div>
                    </button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
