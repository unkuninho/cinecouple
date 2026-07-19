const firebaseConfig = {
  apiKey: "AIzaSyCmD1aHSFFrmRGE13ZR7I99__b29DhdCkA",
  authDomain: "goal-tracker-3f954.firebaseapp.com",
  projectId: "goal-tracker-3f954",
  storageBucket: "goal-tracker-3f954.firebasestorage.app",
  messagingSenderId: "675317109213",
  appId: "1:675317109213:web:b9792bf406a18995722634"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
