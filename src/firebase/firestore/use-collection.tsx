
'use client';

import { useEffect, useState, useRef } from 'react';
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
 * خطاف جلب المجموعات المطور ليعمل بنظام Cache-First.
 * يضمن ظهور البيانات فوراً من الجهاز ويخفي دائرة التحميل بمجرد توفر الكاش.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasDataRef = useRef(false);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: true },
      (snapshot: QuerySnapshot<T>) => {
        const docs = snapshot.docs.map((doc: QueryDocumentSnapshot<T>) => ({
          ...doc.data(),
          id: doc.id,
        }));
        
        setData(docs);
        hasDataRef.current = true;
        
        // السر: بمجرد وصول أي نسخة (حتى لو من الكاش)، ننهي حالة التحميل فوراً
        // snapshot.metadata.fromCache تكون true إذا كانت البيانات من الجهاز
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
        // لا ننهي التحميل إلا إذا لم يكن لدينا بيانات سابقة إطلاقاً وفشل الاتصال
        if (!hasDataRef.current) {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
