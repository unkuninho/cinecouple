// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
// Substitua os valores abaixo pelos dados do SEU projeto Firebase.
// Veja o README.md para o passo a passo de como criar o projeto
// e pegar essas informações (é gratuito e leva ~5 minutos).
// ============================================================

const firebaseConfig = {
  apiKey: "COLE_AQUI_SUA_API_KEY",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI_SEU_PROJECT_ID",
  storageBucket: "COLE_AQUI.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
