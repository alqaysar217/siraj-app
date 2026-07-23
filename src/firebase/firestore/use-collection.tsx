
'use client';

import { useEffect, useState } from 'react';
import {
  Query,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * خطاف جلب المجموعات المطور ليدعم السرعة القصوى (Cache Awareness).
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    // ملاحظة: لا نعيد تعيين loading لـ true إذا كان لدينا بيانات كاش فعلاً
    // لضمان عدم ظهور "دائرة التحميل" عند الانتقال بين الصفحات
    
    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: true }, // نراقب التغييرات لضمان تحديث الكاش بالبيانات الجديدة من السيرفر
      (snapshot: QuerySnapshot<T>) => {
        const docs = snapshot.docs.map((doc: QueryDocumentSnapshot<T>) => ({
          ...doc.data(),
          id: doc.id,
        }));
        
        setData(docs);
        
        // السر هنا: بمجرد وصول أي بيانات (سواء من الكاش أو السيرفر)، ننهي حالة التحميل فوراً
        // snapshot.metadata.fromCache ستكون true في أول ثانية إذا كانت البيانات مخزنة
        setLoading(false); 
        setError(null);
      },
      async (serverError: any) => {
        if (serverError.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: 'collection',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          setError(permissionError);
        } else {
          setError(serverError);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
