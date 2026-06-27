
"use client";

import { useMemo } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, DollarSign, TrendingUp, PlusCircle, UserPlus, PlayCircle, Loader2, BadgeDollarSign } from "lucide-react";
import Link from "next/link";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const db = useFirestore();

  // Fetch real data collections
  const coursesQuery = useMemoFirebase(() => db ? query(collection(db, "courses")) : null, [db]);
  const { data: courses, loading: coursesLoading } = useCollection(coursesQuery);

  const usersQuery = useMemoFirebase(() => db ? query(collection(db, "users")) : null, [db]);
  const { data: users, loading: usersLoading } = useCollection(usersQuery);

  const subsQuery = useMemoFirebase(() => db ? query(collection(db, "subscriptions")) : null, [db]);
  const { data: subscriptions, loading: subsLoading } = useCollection(subsQuery);

  // Calculate Real Statistics
  const statsData = useMemo(() => {
    const totalUsers = users?.length || 0;
    const totalCourses = courses?.length || 0;
    const totalRevenue = subscriptions?.reduce((acc: number, curr: any) => acc + (Number(curr.price) || 0), 0) || 0;
    const totalSubs = subscriptions?.length || 0;

    return [
      { label: "إجمالي الطلاب", value: totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "الدورات المتاحة", value: totalCourses, icon: BookOpen, color: "text-primary", bg: "bg-primary/5" },
      { label: "إجمالي الإيرادات", value: `${totalRevenue.toLocaleString('en-US')} YER`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
      { label: "التراخيص المصدرة", value: totalSubs, icon: BadgeDollarSign, color: "text-secondary", bg: "bg-secondary/5" },
    ];
  }, [users, courses, subscriptions]);

  // Process Weekly Interaction Data (Last 7 Days)
  const weeklyChartData = useMemo(() => {
    if (!users) return [];
    const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const counts: Record<string, number> = {};
    
    // Initialize last 7 days
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return days[d.getDay()];
    }).reverse();

    last7Days.forEach(day => counts[day] = 0);

    users.forEach((u: any) => {
      if (u.createdAt) {
        const date = new Date(u.createdAt);
        const dayName = days[date.getDay()];
        if (counts[dayName] !== undefined) {
          counts[dayName]++;
        }
      }
    });

    return last7Days.map(day => ({ name: day, students: counts[day] }));
  }, [users]);

  // Process Categories Distribution Data
  const categoriesData = useMemo(() => {
    if (!courses) return [];
    const categories: Record<string, number> = {};
    const categoryNames: Record<string, string> = {
      programming: "برمجة",
      web: "ويب",
      design: "تصميم",
      ai: "ذكاء اصطناعي",
      cybersecurity: "أمن سيبراني",
      management: "إدارة",
      accounting: "محاسبة",
    };

    courses.forEach((c: any) => {
      const cat = categoryNames[c.category] || c.category || "أخرى";
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [courses]);

  const COLORS = ['#4A1F0F', '#D98A1E', '#F4C26B', '#2A120B', '#6B3E23', '#A67C52'];

  const isLoading = coursesLoading || usersLoading || subsLoading;

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-right">
            <h1 className="text-3xl font-bold font-headline text-primary mb-2">لوحة التحكم الذكية</h1>
            <p className="text-muted-foreground">مرحباً محمود، إليك نظرة حية ومباشرة على أداء منصة سراج.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-secondary hover:bg-secondary/90 gap-2 rounded-xl h-12 shadow-lg">
              <Link href="/admin/add-course">
                <PlusCircle className="w-5 h-5" /> دورة جديدة
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 rounded-xl h-12">
              <Link href="/admin/manage-users">
                <UserPlus className="w-5 h-5" /> إدارة الطلاب
              </Link>
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary opacity-50" />
            <p className="mt-4 text-muted-foreground font-bold">جاري تحليل البيانات الحية...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {statsData.map((stat, i) => (
                <Card key={i} className="luxury-shadow border-secondary/10 overflow-hidden hover:scale-[1.02] transition-transform">
                  <CardContent className="p-6 flex items-center gap-4 text-right">
                    <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} shrink-0`}>
                      <stat.icon className="w-7 h-7" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xl lg:text-2xl font-black text-primary truncate" dir="ltr">{stat.value}</div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase">{stat.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <Card className="luxury-shadow border-secondary/10">
                <CardHeader className="text-right">
                  <CardTitle className="text-xl">تفاعل الطلاب (آخر 7 أيام)</CardTitle>
                  <CardDescription>عدد الطلاب الجدد المنضمين يومياً للمنصة</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="students" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="luxury-shadow border-secondary/10">
                <CardHeader className="text-right">
                  <CardTitle className="text-xl">توزيع المحتوى الدراسي</CardTitle>
                  <CardDescription>نسبة توزع الدورات حسب المجالات التعليمية</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoriesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {categoriesData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Button asChild variant="outline" className="h-24 rounded-2xl flex flex-col gap-2 border-primary/10 hover:bg-primary/5 shadow-sm">
                <Link href="/admin/add-lesson">
                  <PlayCircle className="w-8 h-8 text-secondary" />
                  <span className="font-bold">إضافة دروس ومناهج</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 rounded-2xl flex flex-col gap-2 border-primary/10 hover:bg-primary/5 shadow-sm">
                <Link href="/admin/manage-users">
                  <Users className="w-8 h-8 text-secondary" />
                  <span className="font-bold">إدارة شؤون الطلاب</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 rounded-2xl flex flex-col gap-2 border-primary/10 hover:bg-primary/5 shadow-sm">
                <Link href="/admin/reports">
                  <DollarSign className="w-8 h-8 text-secondary" />
                  <span className="font-bold">التقارير المالية الكاملة</span>
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
