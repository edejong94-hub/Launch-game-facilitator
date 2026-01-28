import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBnkDjxX18z5FuCxsmDPLBg_3OOGgO4wK4",
  authDomain: "launch-game-99b20.firebaseapp.com",
  projectId: "launch-game-99b20",
  storageBucket: "launch-game-99b20.firebasestorage.app",
  messagingSenderId: "962449052312",
  appId: "1:962449052312:web:3a6f916c4226e3ec1b76ed",
  measurementId: "G-YT1PS3Q9CJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
export default app;