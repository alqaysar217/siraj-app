
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Copy, CreditCard, Banknote, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PaymentInstructions() {
  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-headline mb-4">تعليمات تفعيل الدورة</h1>
          <p className="text-muted-foreground">اتبع الخطوات التالية لتفعيل وصولك للدورة في أقل من 24 ساعة</p>
        </div>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="glass p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 neon-border font-bold text-xl">1</div>
              <div className="space-y-4 w-full">
                <h3 className="text-xl font-bold">تحويل الرسوم</h3>
                <p className="text-muted-foreground">قم بتحويل مبلغ الدورة (250 ريال) إلى أحد الحسابات التالية:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-accent text-sm font-bold">
                      <CreditCard className="w-4 h-4" /> مصرف الراجحي
                    </div>
                    <div className="font-mono text-lg tracking-wider">SA 1234 5678 9012 3456</div>
                    <Button variant="ghost" size="sm" className="w-full text-xs gap-2 border-white/5 border">
                      <Copy className="w-3 h-3" /> نسخ الآيبان
                    </Button>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-primary text-sm font-bold">
                      <Banknote className="w-4 h-4" /> البنك الأهلي
                    </div>
                    <div className="font-mono text-lg tracking-wider">SA 9876 5432 1098 7654</div>
                    <Button variant="ghost" size="sm" className="w-full text-xs gap-2 border-white/5 border">
                      <Copy className="w-3 h-3" /> نسخ الآيبان
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass p-8 rounded-3xl relative overflow-hidden">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shrink-0 neon-accent text-background font-bold text-xl">2</div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold">إرسال سند التحويل</h3>
                <p className="text-muted-foreground leading-relaxed">
                  بعد إتمام عملية التحويل، يرجى تصوير إيصال العملية وإرساله عبر الواتساب إلى الرقم التالي مع توضيح اسم الدورة وبريدك الإلكتروني المسجل في المنصة:
                </p>
                <Button asChild size="lg" className="rounded-2xl bg-green-600 hover:bg-green-700 neon-border border-green-400">
                  <a href="https://wa.me/966000000000" target="_blank" rel="noopener noreferrer">ارسال السند عبر واتساب</a>
                </Button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass p-8 rounded-3xl relative overflow-hidden">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 font-bold text-xl">3</div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold">تفعيل الحساب</h3>
                <p className="text-muted-foreground leading-relaxed">
                  سيقوم فريق الإدارة بمراجعة السند وتفعيل وصولك للدورة فوراً. ستصلك رسالة تأكيد عبر البريد الإلكتروني بمجرد التفعيل.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-8">
            <Button asChild variant="outline" className="rounded-2xl glass border-white/10 h-12 px-8">
              <Link href="/">العودة للرئيسية</Link>
            </Button>
            <Button asChild className="rounded-2xl neon-border h-12 px-8">
              <Link href="/auth/register" className="flex items-center gap-2">
                أنشئ حسابك أولاً <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
