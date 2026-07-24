
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { app as appInstance, auth as authInstance, db as dbInstance } from './index';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  db: null,
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instances, setInstances] = useState<FirebaseContextType>({
    app: appInstance || null,
    auth: authInstance || null,
    db: dbInstance || null,
  });

  useEffect(() => {
    // التأكد من مزامنة الحالات في حال تأخرت التهيئة قليلاً
    if (!instances.app && appInstance) {
      setInstances({
        app: appInstance,
        auth: authInstance,
        db: dbInstance
      });
    }
  }, [instances.app]);

  return (
    <FirebaseContext.Provider value={instances}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
export const useAuth = () => useContext(FirebaseContext).auth;
export const useFirestore = () => useContext(FirebaseContext).db;
