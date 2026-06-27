"use client";

import { useMemo, useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  BookOpen, 
  Loader2,
  BadgeDollarSign,
  Clock,
  ShieldCheck,
  RefreshCw,
  Download,
  Filter,
  Search,
  Mail,
  ChevronDown,
  X,
  ExternalLink
} from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function FinancialReportsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // States for filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const subsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "subscriptions"), orderBy("activatedAt", "desc")) : null
  , [db]);
  
  const { data: subscriptions, loading } = useCollection(subsQuery);

  const coursesQuery = useMemoFirebase(() => db ? collection(db, "courses") : null, [db]);
  const { data: courses } = useCollection(coursesQuery);

  // Filtering & Search Logic
  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    return subscriptions.filter((sub: any) => {
      const matchCourse = filterCourse === "all" || sub.courseId === filterCourse;
      const subDate = new Date(sub.activatedAt);
      const matchStart = !filterStart || subDate >= new Date(filterStart);
      const matchEnd = !filterEnd || subDate <= new Date(filterEnd + "T23:59:59");
      
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        (sub.userName || "").toLowerCase().includes(searchLower) ||
        (sub.userEmail || "").toLowerCase().includes(searchLower) ||
        (sub.courseTitle || "").toLowerCase().includes(searchLower) ||
        (sub.userId || "").toLowerCase().includes(searchLower);

      return matchCourse && matchStart && matchEnd && matchSearch;
    });
  }, [subscriptions, filterCourse, filterStart, filterEnd, searchTerm]);

  const stats = useMemo(() => {
    const subs = filteredSubscriptions;
    const total = subs.reduce((acc: number, curr: any) => acc + (Number(curr.price) || 0), 0);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = subs
      .filter((s: any) => new Date(s.activatedAt) >= thirtyDaysAgo)
      .reduce((acc: number, curr: any) => acc + (Number(curr.price) || 0), 0);

    return {
      totalRevenue: total,
      count: subs.length,
      recentSales: recentSales
    };
  }, [filteredSubscriptions]);

  const chartData = useMemo(() => {
    if (!filteredSubscriptions.length) return [];
    const grouped: Record<string, number> = {};
    const sorted = [...filteredSubscriptions].sort((a, b) => 
      new Date(a.activatedAt).getTime() - new Date(b.activatedAt).getTime()
    );

    sorted.forEach((sub: any) => {
      const date = new Date(sub.activatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + (Number(sub.price) || 0);
    });

    return Object.entries(grouped).map(([name, sales]) => ({ name, sales }));
  }, [filteredSubscriptions]);

  const exportToCSV = () => {
    if (!filteredSubscriptions.length) return;
    const headers = ["Student Name", "Identifier/Email", "Course", "Price (YER)", "Activated At", "Expires At"];
    const rows = filteredSubscriptions.map((sub: any) => [
      `"${sub.userName}"`,
      `"${sub.userEmail || sub.userId}"`,
      `"${sub.courseTitle}"`,
      sub.price,
      new Date(sub.activatedAt).toLocaleDateString('en-US'),
      sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('en-US') : "Lifetime"
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Siraj_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const syncLegacyData = async () => {
    if (!db) return;
    setSyncing(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const subsSnap = await getDocs(collection(db, "subscriptions"));
      const usersMap = new Map(usersSnap.docs.map(d => [d.id, d.data()]));

      let updatedCount = 0;
      let batch = writeBatch(db);
      let opCount = 0;

      for (const subDoc of subsSnap.docs) {
        const subData = subDoc.data();
        const user = usersMap.get(subData.userId);
        
        const needsUpdate = !subData.userEmail || subData.userEmail === subData.userId || !subData.userEmail.includes('@');
        
        if (needsUpdate && user && user.email) {
          batch.update(doc(db, "subscriptions", subDoc.id), {
            userEmail: user.email,
            userName: user.name || subData.userName
          });
          updatedCount++;
          opCount++;

          // الحد الأقصى لـ Firestore Batch هو 500 عملية
          if (opCount >= 500) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
          }
        }
      }

      // التزام بآخر دفعة إذا لم تكن فارغة
      if (opCount > 0) {
        await batch.commit();
      }

      toast({ title: "اكتمل التحديث", description: `تم تصحيح وتحديث البريد الإلكتروني لـ ${updatedCount} سجل مالي باستخدام نظام الدفعات الحماية.` });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث البيانات بسبب ضغط الطلبات. يرجى المحاولة لاحقاً." });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-right">
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary mb-1">التقارير المالية والاشتراكات</h1>
            <p className="text-muted-foreground text-sm">مراقبة حية للمبيعات وسجلات تراخيص الطلاب بالبريد الإلكتروني.</p>
          </div>
          <Button 
            onClick={syncLegacyData} 
            disabled={syncing}
            variant="outline" 
            className="rounded-xl border-secondary/20 text-secondary gap-2 font-bold hover:bg-secondary/5 h-10 text-xs"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            تحديث وربط الإيميلات
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="luxury-shadow border-none bg-card/60">
            <CardContent className="p-5 flex items-center gap-4 flex-row-reverse">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right flex-1">
                <div className="text-xl md:text-2xl font-black text-primary" dir="ltr">
                  {mounted ? stats.totalRevenue.toLocaleString('en-US') : '0'} <small className="text-[10px]">YER</small>
                </div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase">إجمالي الإيرادات</div>
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-none bg-card/60">
            <CardContent className="p-5 flex items-center gap-4 flex-row-reverse">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right flex-1">
                <div className="text-xl md:text-2xl font-black text-primary" dir="ltr">{stats.count}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase">التراخيص المصدرة</div>
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-none bg-card/60">
            <CardContent className="p-5 flex items-center gap-4 flex-row-reverse">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-right flex-1">
                <div className="text-xl md:text-2xl font-black text-primary" dir="ltr">
                  {mounted ? stats.recentSales.toLocaleString('en-US') : '0'} <small className="text-[10px]">YER</small>
                </div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase">مبيعات آخر 30 يوماً</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="luxury-shadow border-none bg-card/40 backdrop-blur-sm rounded-[2rem] overflow-hidden mb-8">
          <CardHeader className="bg-muted/20 border-b border-border/50 p-5">
            <CardTitle className="text-base font-black text-primary">نمو المبيعات (نظرة بيانية)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--secondary))" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="relative flex-1 w-full">
              <Input 
                placeholder="ابحث بالاسم، البريد الإلكتروني، أو الدورة..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-xl bg-card border-primary/10 pr-10 shadow-sm text-sm" 
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline" 
                size="sm"
                className={cn(
                  "h-11 px-4 rounded-xl font-bold gap-2 flex-1 md:flex-none border-primary/10",
                  showFilters && "bg-primary/5 border-primary/20"
                )}
              >
                <Filter className="w-4 h-4 text-secondary" />
                تصفية
              </Button>
              
              <Button 
                onClick={exportToCSV}
                variant="outline" 
                size="sm"
                className="h-11 px-4 rounded-xl font-bold gap-2 flex-1 md:flex-none border-primary/10"
              >
                <Download className="w-4 h-4 text-secondary" />
                تصدير
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card className="luxury-shadow border-none bg-muted/30 rounded-2xl animate-in slide-in-from-top-2 duration-300">
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground mr-1">حسب الدورة</label>
                  <Select value={filterCourse} onValueChange={setFilterCourse}>
                    <SelectTrigger dir="rtl" className="h-10 rounded-lg bg-background">
                      <SelectValue placeholder="اختر الدورة..." />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="all">كل الدورات</SelectItem>
                      {courses?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground mr-1">من تاريخ</label>
                  <Input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="h-10 rounded-lg bg-background text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground mr-1">إلى تاريخ</label>
                  <div className="flex gap-2">
                    <Input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="h-10 rounded-lg bg-background text-xs flex-1" />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-lg text-destructive"
                      onClick={() => { setFilterCourse("all"); setFilterStart(""); setFilterEnd(""); setSearchTerm(""); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="luxury-shadow border-none bg-card/60 backdrop-blur-sm overflow-hidden rounded-[1.5rem] md:rounded-[2rem]">
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-secondary mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-xs font-bold">جاري تحميل السجلات...</p>
                </div>
              ) : filteredSubscriptions.length > 0 ? (
                <Table className="text-right min-w-[850px]">
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-right font-black py-4">الطالب والبريد الإلكتروني</TableHead>
                      <TableHead className="text-right font-black py-4">الدورة التعليمية</TableHead>
                      <TableHead className="text-center font-black py-4">المبلغ</TableHead>
                      <TableHead className="text-center font-black py-4">التفعيل</TableHead>
                      <TableHead className="text-center font-black py-4">الانتهاء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((sub: any) => (
                      <TableRow key={sub.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5">
                        <TableCell className="py-4">
                          <div className="text-right">
                            <div className="font-black text-primary text-sm">{sub.userName}</div>
                            <Link 
                              href={`/admin/manage-users?search=${sub.userId}`}
                              className="text-[11px] text-secondary hover:underline flex items-center justify-start gap-1 mt-0.5" 
                              dir="rtl"
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              <span className="font-bold truncate max-w-[150px]">
                                {sub.userEmail || sub.userId}
                              </span>
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-secondary/10 rounded-lg shrink-0">
                              <BookOpen className="w-4 h-4 text-secondary" />
                            </div>
                            <span className="text-xs font-bold text-primary truncate max-w-[180px]">{sub.courseTitle}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-black text-green-700" dir="ltr">
                            {mounted ? Number(sub.price).toLocaleString('en-US') : sub.price} <small className="text-[9px] font-bold">YER</small>
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-[10px] text-muted-foreground flex flex-col items-center" dir="ltr">
                            <span className="flex items-center justify-center gap-1 font-bold text-primary">
                              <Calendar className="w-3 h-3 text-secondary" /> 
                              {mounted && sub.activatedAt ? new Date(sub.activatedAt).toLocaleDateString('en-US') : ''}
                            </span>
                            <span className="opacity-70 font-mono">
                              {mounted && sub.activatedAt ? new Date(sub.activatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {sub.expiresAt ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 font-black gap-1.5 py-0.5 px-2 text-[9px]" dir="ltr">
                              <Clock className="w-2.5 h-2.5" />
                              {mounted ? new Date(sub.expiresAt).toLocaleDateString('en-US') : ''}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 font-black gap-1.5 py-0.5 px-2 text-[9px]">
                              <ShieldCheck className="w-3 h-3" />
                              Lifetime
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-32 text-center">
                  <BadgeDollarSign className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-primary">لا توجد سجلات مطابقة</h3>
                  <p className="text-muted-foreground text-xs mt-2">جرب تغيير خيارات البحث أو الفلترة أو الضغط على "تحديث وربط الإيميلات".</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
