import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
apiKey: "AIzaSyC6Im4diQMyrZTqctjD-bjzLubR0_sJYPI",
authDomain: "omsorgstavle.firebaseapp.com",
projectId: "omsorgstavle",
storageBucket: "omsorgstavle.firebasestorage.app",
messagingSenderId: "65604734729",
appId: "1:65604734729:web:fa101e1f4697572c4c0dd8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

