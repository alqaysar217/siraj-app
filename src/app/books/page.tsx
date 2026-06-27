"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Library, 
  Star, 
  User, 
  Loader2, 
  Tags, 
  ArrowRight,
  FileText,
  BookMarked,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export default function PublicBooksPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const db = useFirestore();
  const booksQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "books"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: books, loading } = useCollection(booksQuery);

  const getFormatName = (format: string) => {
    const formats: Record<string, string> = {
      paper: "نسخة ورقية",
      digital: "نسخة رقمية",
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

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    return books.filter((book: any) => {
      const matchesSearch = (book.title || "").toLowerCase().includes(search.toLowerCase()) || 
                           (book.author || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || book.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [books, search, category]);

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 space-y-6">
          <div className="text-right">
            <h1 className="text-2xl md:text-4xl font-black font-headline text-primary mb-1">مكتبة سراج العلمية</h1>
            <p className="text-muted-foreground text-xs md:text-base font-medium">اختر كتابك القادم من بين أفضل المراجع المتخصصة الموثقة.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input 
                placeholder="ابحث عن كتاب أو مؤلف..." 
                className="h-12 md:h-14 pr-10 text-right rounded-xl border-primary/10 luxury-shadow bg-card text-sm" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 md:h-14 px-4 rounded-xl border-primary/10 luxury-shadow bg-card gap-2">
                  <Filter className="w-4 h-4 text-secondary" />
                  <span className="hidden sm:inline font-bold">الأقسام</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0 overflow-y-auto" dir="rtl">
                <SheetHeader className="p-8 text-right border-b bg-muted/10 relative">
                   <SheetClose asChild className="absolute left-4 top-1/2 -translate-y-1/2 z-50">
                        <div className="p-2 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all cursor-pointer">
                          <X className="w-5 h-5 text-primary" />
                        </div>
                   </SheetClose>
                  <SheetTitle className="text-xl font-headline text-primary flex items-center justify-start gap-2">
                    <Filter className="w-5 h-5 text-secondary" />
                    أقسام المكتبة
                  </SheetTitle>
                </SheetHeader>
                
                <div className="p-8 space-y-6 text-right">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2 block">اختر التخصص</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger dir="rtl" className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="all">كل الأقسام</SelectItem>
                        <SelectItem value="programming">البرمجة والتطوير</SelectItem>
                        <SelectItem value="web">تطوير الويب</SelectItem>
                        <SelectItem value="games">برمجة الألعاب</SelectItem>
                        <SelectItem value="networks">الشبكات والسيرفرات</SelectItem>
                        <SelectItem value="os">نظم التشغيل</SelectItem>
                        <SelectItem value="databases">قواعد البيانات</SelectItem>
                        <SelectItem value="ai">الذكاء الاصطناعي</SelectItem>
                        <SelectItem value="cybersecurity">الأمن السيبراني</SelectItem>
                        <SelectItem value="encryption">التشفير والحماية</SelectItem>
                        <SelectItem value="design">التصميم الإبداعي</SelectItem>
                        <SelectItem value="management">الإدارة والقيادة</SelectItem>
                        <SelectItem value="accounting">المحاسبة والمالية</SelectItem>
                        <SelectItem value="economics">الاقتصاد</SelectItem>
                        <SelectItem value="analysis">تحليل البيانات</SelectItem>
                        <SelectItem value="math">الرياضيات البرمجية</SelectItem>
                        <SelectItem value="statistics">الإحصاء</SelectItem>
                        <SelectItem value="quantitative">الأساليب الكمية</SelectItem>
                        <SelectItem value="general">ثقافة عامة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => {setCategory("all"); setSearch("");}} variant="ghost" className="w-full text-destructive text-xs font-bold">إعادة ضبط</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="w-12 h-12 animate-spin text-secondary" /></div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredBooks.map((book: any) => (
              <Card key={book.id} className="overflow-hidden group luxury-shadow flex flex-col h-full rounded-2xl border border-primary/5 bg-card/80 backdrop-blur-sm transition-all hover:translate-y-[-4px]">
                <div className="relative aspect-[3/4] overflow-hidden max-h-[220px] md:max-h-none">
                  <Image 
                    src={book.imageUrl || "https://picsum.photos/seed/book/600/800"} 
                    alt={book.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-secondary/90 text-white border-none px-2 py-0.5 rounded-lg shadow-lg font-bold text-[8px]">
                      {getFormatName(book.format)}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 flex-grow space-y-3 text-right">
                  <h3 className="text-sm md:text-base font-black text-primary line-clamp-1 leading-tight group-hover:text-secondary transition-colors">
                    {book.title}
                  </h3>
                  
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="w-3 h-3 text-secondary" />
                      <span>{book.author}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground border-r pr-3 border-primary/5">
                      <Tags className="w-3 h-3 text-secondary" />
                      <span>{getCategoryName(book.category)}</span>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-2.5 space-y-2 border border-primary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-secondary fill-secondary" />
                          <span className="text-[9px] font-black text-primary">{book.rating || 5.0}</span>
                        </div>
                        <div className="flex items-center gap-0.5 border-r pr-2 border-primary/10">
                          <FileText className="w-2.5 h-2.5 text-secondary" />
                          <span className="text-[9px] font-black text-primary">{book.pages} ص</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] md:text-sm font-black text-secondary">{book.price} <small className="text-[7px]">ر.ي</small></span>
                        {book.oldPrice > 0 && (
                          <span className="text-[8px] text-muted-foreground line-through opacity-50">{book.oldPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full rounded-xl h-9 bg-primary text-white hover:bg-primary/90 shadow-sm font-bold text-[10px] gap-2">
                    <Link href={`/book/${book.id}`}>تفاصيل الكتاب <ArrowRight className="w-3.5 h-3.5 rotate-180" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border/50">
            <Library className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-primary mb-2">لا توجد كتب مطابقة</h3>
            <Button variant="link" onClick={() => {setCategory("all"); setSearch("");}} className="text-secondary font-bold text-xs">عرض كل المكتبة</Button>
          </div>
        )}
      </div>
    </div>
  );
}
