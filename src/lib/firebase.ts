
'use client';
/**
 * Consolidated Firebase exports. 
 * This file now uses the centralized initialization from @/firebase.
 */
import { initializeFirebase } from '@/firebase';

const { auth, db } = initializeFirebase();

export { auth, db };
