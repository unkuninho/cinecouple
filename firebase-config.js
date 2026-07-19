// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
// Substitua os valores abaixo pelos dados do SEU projeto Firebase.
// Veja o README.md para o passo a passo de como criar o projeto
// e pegar essas informações (é gratuito e leva ~5 minutos).
// ============================================================

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

// Garante que a sessão fica salva no navegador entre recarregamentos de página.
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
  console.error("Não deu pra configurar a persistência de sessão:", err);
});
