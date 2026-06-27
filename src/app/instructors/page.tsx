
"use client";

import Navbar from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  ShieldCheck, 
  Star, 
  MessageCircle, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Briefcase,
  Loader2,
  UsersRound,
  ChevronLeft
} from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function InstructorsPage() {
  const db = useFirestore();
  const instructorsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "instructors"), orderBy("createdAt", "desc")) : null
  , [db]);

  const { data: instructors, loading } = useCollection(instructorsQuery);

  const getCategoryName = (slug: string) => {
    const categories: Record<string, string> = {
      programming: "البرمجة والتطوير",
      web: "تطوير الويب",
      design: "التصميم الإبداعي",
      ai: "الذكاء الاصطناعي",
      cybersecurity: "الأمن السيبراني",
      management: "الإدارة والقيادة",
    };
    return categories[slug] || slug;
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="mb-12 text-center space-y-4">
           <div className="w-20 h-20 bg-secondary/10 rounded-3xl flex items-center justify-center mx-auto text-secondary mb-4 luxury-shadow border border-secondary/5">
              <UsersRound className="w-10 h-10" />
           </div>
           <h1 className="text-3xl md:text-5xl font-black font-headline text-primary">نخبة مدربي سراج</h1>
           <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
             تعرف على الخبراء الذين سيرافقونك في رحلتك التعليمية؛ نخبة من المتخصصين المعتمدين لنقل خبراتهم العملية لك.
           </p>
        </header>

        {loading ? (
          <div className="py-32 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary opacity-50" />
          </div>
        ) : instructors && instructors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map((instructor: any) => (
              <Card key={instructor.id} className="overflow-hidden group luxury-shadow flex flex-col h-full rounded-[2.5rem] border border-primary/5 bg-card/80 backdrop-blur-sm transition-all hover:translate-y-[-8px]">
                {/* الجزء العلوي: الصورة والمجال */}
                <div className="relative aspect-square overflow-hidden max-h-56">
                  <img 
                    src={instructor.photoURL || `https://picsum.photos/seed/${instructor.id}/400/400`} 
                    alt={instructor.name} 
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-4 right-4">
                     <Badge className="bg-secondary/90 text-white border-none px-4 py-1 rounded-xl font-black text-[10px] shadow-lg">
                        {getCategoryName(instructor.specialty)}
                     </Badge>
                  </div>
                </div>

                <div className="p-6 flex-grow space-y-6 text-right">
                  {/* السطر الأول: الاسم والتوثيق والنجوم */}
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h3 className="text-xl font-black text-primary font-headline leading-none">{instructor.name}</h3>
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px]">
                           <ShieldCheck className="w-3.5 h-3.5" />
                           <span>{instructor.accreditation || "مدرب معتمد"}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-1 bg-primary/5 px-2.5 py-1.5 rounded-xl border border-primary/5">
                        <Star className="w-4 h-4 text-secondary fill-secondary" />
                        <span className="text-xs font-black text-primary">{instructor.rating || "5.0"}</span>
                     </div>
                  </div>
                  
                  {/* السطر الثاني: الوصف */}
                  <p className="text-muted-foreground text-xs font-medium line-clamp-1 leading-relaxed text-center px-4 italic opacity-90">
                    "{instructor.bio}"
                  </p>

                  {/* السطر الثالث: أيقونات التواصل الاجتماعي */}
                  <div className="flex items-center justify-center gap-4 py-2">
                    {instructor.socials?.linkedin && (
                      <a href={instructor.socials.linkedin} target="_blank" className="text-[#0077B5] hover:scale-125 transition-transform"><Linkedin className="w-5 h-5" /></a>
                    )}
                    {instructor.socials?.instagram && (
                      <a href={instructor.socials.instagram} target="_blank" className="text-[#E4405F] hover:scale-125 transition-transform"><Instagram className="w-5 h-5" /></a>
                    )}
                    {instructor.socials?.facebook && (
                      <a href={instructor.socials.facebook} target="_blank" className="text-[#1877F2] hover:scale-125 transition-transform"><Facebook className="w-5 h-5" /></a>
                    )}
                    {instructor.socials?.whatsapp && (
                      <a href={`https://wa.me/${instructor.socials.whatsapp}`} target="_blank" className="text-[#25D366] hover:scale-125 transition-transform"><MessageCircle className="w-5 h-5" /></a>
                    )}
                  </div>

                  {/* السطر الرابع: زر التفاصيل */}
                  <Button asChild className="w-full h-11 rounded-2xl bg-primary text-white font-black text-xs gap-2 shadow-lg shadow-primary/10 transition-transform active:scale-95">
                    <Link href={`/instructor/${instructor.id}`}>
                      عرض الملف الكامل <ChevronLeft className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center bg-card/50 rounded-[2.5rem] border-2 border-dashed border-primary/10">
            <User className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary">يتم تحديث قائمة المدربين حالياً</h3>
          </div>
        )}
      </div>
    </div>
  );
}
