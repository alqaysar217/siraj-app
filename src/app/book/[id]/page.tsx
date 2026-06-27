
"use client";

import { useState, use, useEffect, useMemo } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  User, 
  Star, 
  Loader2, 
  MessageCircle, 
  Library,
  Layers,
  FileText,
  BadgeDollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Package,
  ArrowLeft,
  ChevronDown,
  Trophy,
  Bookmark,
  Share2
} from "lucide-react";
import { useDoc, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";

const WHATSAPP_NUMBER = "+967735952927";

export default function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { profile } = useUser();

  const bookRef = useMemoFirebase(() => db ? doc(db, "books", id) : null, [db, id]);
  const { data: book, loading: bookLoading } = useDoc(bookRef);

  const chaptersQuery = useMemoFirebase(() => 
    db ? query(collection(db, "books", id, "chapters"), orderBy("order", "asc")) : null
  , [db, id]);
  const { data: chapters, loading: chaptersLoading } = useCollection(chaptersQuery);

  const getFormatName = (format: string) => {
    const formats: Record<string, string> = {
      paper: "نسخة ورقية فاخرة",
      digital: "نسخة رقمية (PDF)",
      both: "ورقي + رقمي"
    };
    return formats[format] || format;
  };

  const getCategoryName = (slug: string) => {
    const categories: Record<string, string> = {
      programming: "البرمجة والتطوير",
      web: "تطوير الويب",
      games: "برمجة الألعاب",
      networks: "الشبكات والسيرفرات",
      os: "نظم التشغيل",
      databases: "قواعد البيانات",
      ai: "الذكاء الاصطناعي",
      cybersecurity: "الأمن السيبراني",
      encryption: "التشفير والحماية",
      design: "التصميم الإبداعي",
      management: "الإدارة والقيادة",
      accounting: "المحاسبة والمالية",
      economics: "الاقتصاد",
      analysis: "تحليل البيانات",
      math: "الرياضيات البرمجية",
      statistics: "الإحصاء",
      quantitative: "الأساليب الكمية",
      general: "ثقافة عامة"
    };
    return categories[slug] || slug;
  };

  if (bookLoading || chaptersLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Library className="w-20 h-20 text-muted-foreground/30 mb-6" />
          <h1 className="text-2xl font-bold text-primary">عذراً، هذا الكتاب غير متوفر حالياً</h1>
          <Button asChild className="mt-6 bg-primary text-white rounded-xl h-12 px-8">
            <Link href="/books">العودة للمكتبة</Link>
          </Button>
        </div>
      </div>
    );
  }

  const whatsappMessage = `أهلاً سراج، أنا الطالب (${profile?.name || 'جديد'})، أود طلب كتاب (${book.title})، يرجى تزويدي بطريقة الاستلام والتفعيل.`;

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      
      {/* Mobile Top Header (Fixed on Desktop) */}
      <div className="bg-primary text-white py-12 px-4 text-center space-y-4">
          <Badge className="bg-secondary text-white border-none px-4 py-1 rounded-full font-bold text-xs">
            {getCategoryName(book.category)}
          </Badge>
          <h1 className="text-2xl md:text-5xl font-black font-headline leading-tight max-w-4xl mx-auto">
            {book.title}
          </h1>
          <div className="flex items-center justify-center gap-3">
             <Avatar className="h-8 w-8 border-2 border-white/20">
                <AvatarFallback className="bg-white/10 text-white text-[10px] font-bold">{book.author?.charAt(0)}</AvatarFallback>
             </Avatar>
             <span className="text-sm font-bold opacity-90">{book.author}</span>
          </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-20 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Media & Core Info */}
          <div className="space-y-6">
            <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden luxury-shadow border-8 border-white bg-white">
              <Image 
                src={book.imageUrl || "https://picsum.photos/seed/book/600/800"} 
                alt={book.title} 
                fill 
                className="object-cover"
                priority
              />
            </div>

            {/* Quick Stats Grid Under Cover */}
            <div className="grid grid-cols-3 gap-3">
               {[
                 { label: "الصفحات", val: book.pages, icon: FileText, color: "text-blue-600" },
                 { label: "التقييم", val: book.rating || 5.0, icon: Star, color: "text-yellow-600" },
                 { label: "الحالة", val: "أصلي", icon: ShieldCheck, color: "text-green-600" },
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-3 rounded-2xl luxury-shadow border border-primary/5 text-center space-y-1">
                    <stat.icon className={cn("w-5 h-5 mx-auto", stat.color)} />
                    <p className="text-[10px] font-black text-primary">{stat.val}</p>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase">{stat.label}</p>
                 </div>
               ))}
            </div>

            <Card className="rounded-[2.5rem] border-none luxury-shadow p-8 bg-white space-y-6">
               <div className="text-center space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">سعر النسخة</p>
                  <div className="flex flex-col items-center gap-1">
                     <div className="flex items-center gap-3">
                        <span className="text-4xl font-black text-secondary">{book.price} <small className="text-xs">ر.ي</small></span>
                        {book.oldPrice > 0 && <span className="text-lg text-muted-foreground line-through opacity-40">{book.oldPrice}</span>}
                     </div>
                  </div>
               </div>
               
               <Separator className="opacity-50" />
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-secondary" /> نوع الإصدار
                     </span>
                     <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[10px] font-bold">{getFormatName(book.format)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                        <Package className="w-4 h-4 text-secondary" /> التوفر
                     </span>
                     <span className="text-green-600 text-xs font-black flex items-center gap-1">متوفر في المخزن <CheckCircle2 className="w-3.5 h-3.5" /></span>
                  </div>
               </div>

               <Button asChild className="w-full h-16 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-2xl font-black text-lg gap-3 shadow-xl shadow-green-600/20 transition-all active:scale-95">
                  <a href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank">
                    <MessageCircle className="w-6 h-6" /> اطلب النسخة عبر واتساب
                  </a>
               </Button>
               <p className="text-[10px] text-center text-muted-foreground font-bold leading-relaxed px-4">سيتم الرد عليك فوراً لتأكيد العنوان وطريقة الدفع والاستلام.</p>
            </Card>
          </div>

          {/* Column 2: Detailed Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[2.5rem] border-none luxury-shadow p-8 md:p-12 bg-white text-right space-y-10">
               
               <section className="space-y-4">
                  <h3 className="text-2xl font-black text-primary font-headline flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-xl text-secondary"><FileText className="w-6 h-6" /></div>
                    نبذة عن الكتاب
                  </h3>
                  <p className="text-lg text-muted-foreground leading-[1.8] font-medium whitespace-pre-line pr-2">
                    {book.description}
                  </p>
               </section>

               {book.features && book.features.length > 0 && (
                 <section className="space-y-4">
                   <h3 className="text-2xl font-black text-primary font-headline flex items-center gap-3">
                     <div className="p-2 bg-secondary/10 rounded-xl text-secondary"><Trophy className="w-6 h-6" /></div>
                     مميزات هذا الإصدار
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
                     {book.features.map((feature: string, i: number) => (
                       <div key={i} className="flex items-start gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/5 group hover:bg-primary/10 transition-colors">
                         <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-secondary shadow-sm mt-0.5 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                         </div>
                         <span className="text-sm md:text-base font-bold text-primary/80">{feature}</span>
                       </div>
                     ))}
                   </div>
                 </section>
               )}

               <section className="space-y-4">
                  <h3 className="text-2xl font-black text-primary font-headline flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-xl text-secondary"><Layers className="w-6 h-6" /></div>
                    فصول ومحتويات الكتاب
                  </h3>
                  
                  <Accordion type="single" collapsible className="space-y-3 pr-2">
                    {chapters && chapters.length > 0 ? (
                      chapters.map((chapter: any, idx: number) => (
                        <AccordionItem key={chapter.id} value={`chapter-${idx}`} className="border rounded-2xl overflow-hidden bg-muted/20 border-primary/5 luxury-shadow">
                           <AccordionTrigger className="hover:no-underline py-5 px-6 text-right [&[data-state=open]>svg]:rotate-180">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md">{idx + 1}</div>
                                 <span className="text-lg font-black text-primary">{chapter.title}</span>
                              </div>
                           </AccordionTrigger>
                           <AccordionContent className="p-5 bg-white/50 space-y-3">
                              {chapter.lessons && chapter.lessons.length > 0 ? (
                                chapter.lessons.map((lesson: string, lIdx: number) => (
                                  <div key={lIdx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors border-b border-primary/5 last:border-none">
                                     <div className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                                     <span className="text-sm font-bold text-muted-foreground">{lesson}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-4 italic font-bold">سيتم تحديث مواضيع هذا الفصل قريباً.</p>
                              )}
                           </AccordionContent>
                        </AccordionItem>
                      ))
                    ) : (
                      <div className="p-12 text-center border-2 border-dashed rounded-[2.5rem] text-muted-foreground font-bold text-sm bg-muted/10">
                        يتم العمل على رفع هيكل الكتاب الفني حالياً...
                      </div>
                    )}
                  </Accordion>
               </section>

               <div className="pt-10 flex flex-col md:flex-row gap-4">
                  <Button asChild variant="outline" className="h-14 rounded-2xl border-primary/10 gap-2 font-black text-primary flex-1 shadow-sm">
                     <Link href="/books">
                        <ArrowRight className="w-5 h-5" /> العودة لكافة الكتب في المكتبة
                     </Link>
                  </Button>
                  <Button variant="ghost" className="h-14 rounded-2xl gap-2 font-black text-muted-foreground">
                     <Share2 className="w-5 h-5" /> مشاركة رابط الكتاب
                  </Button>
               </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
