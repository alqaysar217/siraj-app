/**
 * Firebase configuration object.
 * Hardcoded with the configuration provided by the user for direct connection.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBZazVh36etKQZq20Qn42TTxB4giQVd5TY",
  authDomain: "studio-4398737486-c7df0.firebaseapp.com",
  projectId: "studio-4398737486-c7df0",
  storageBucket: "studio-4398737486-c7df0.firebasestorage.app",
  messagingSenderId: "1005858495682",
  appId: "1:1005858495682:web:1041a83b4c31f2ebc06f5b",
};

/**
 * Checks if the Firebase configuration is valid.
 */
export const isFirebaseConfigValid = () => {
  return !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10;
};
