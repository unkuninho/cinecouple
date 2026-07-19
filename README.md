# 🎟️ Dupla Sessão

App para casais guardarem o histórico de filmes e séries que assistem juntos, com nota de cada pessoa e média do casal. Funciona 100% no navegador (HTML/CSS/JS puro) e roda de graça no GitHub Pages. Os dados ficam salvos no Firebase, então os dois conseguem entrar de computadores diferentes e ver a mesma coisa.

Existem duas partes na configuração: **(1) criar o banco de dados gratuito no Firebase** e **(2) publicar o site no GitHub Pages**. Leva uns 10 minutos, sem precisar programar nada.

---

## Parte 1 — Criar o projeto no Firebase (gratuito)

1. Acesse **https://console.firebase.google.com** e faça login com uma conta Google.
2. Clique em **"Adicionar projeto"**, dê um nome (ex: `dupla-sessao`) e siga os passos (pode desativar o Google Analytics, não é necessário).
3. Dentro do projeto, no menu lateral, clique em **Build → Authentication**.
   - Clique em **"Get started"**.
   - Na aba **Sign-in method**, clique em **"E-mail/senha"** e ative a primeira opção. Salve.
4. Ainda no menu lateral, clique em **Build → Firestore Database**.
   - Clique em **"Create database"**.
   - Escolha uma localização (qualquer uma próxima do Brasil, ex: `southamerica-east1`).
   - Selecione **"Start in production mode"** e crie.
5. Depois do banco criado, vá na aba **Rules** (dentro do Firestore) e substitua o conteúdo por este:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /couples/{coupleId} {
         allow read, write: if request.auth != null && request.auth.uid == coupleId;
         match /titles/{titleId} {
           allow read, write: if request.auth != null && request.auth.uid == coupleId;
         }
       }
     }
   }
   ```

   Isso garante que cada casal só enxerga os próprios dados. Clique em **"Publish"**.

6. Agora volte para a visão geral do projeto (ícone de casinha) e clique no ícone **`</>`** ("Web") para registrar um app da web.
   - Dê um apelido (ex: `dupla-sessao-web`) e clique em **"Registrar app"**.
   - O Firebase vai mostrar um bloco de código com um objeto `firebaseConfig = { apiKey: ..., authDomain: ..., ... }`. **Copie esses valores.**

7. Abra o arquivo **`js/firebase-config.js`** deste projeto e cole os valores copiados no lugar de `COLE_AQUI_...`. Fica assim (com seus próprios valores):

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "dupla-sessao-xxxx.firebaseapp.com",
     projectId: "dupla-sessao-xxxx",
     storageBucket: "dupla-sessao-xxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

   Salve o arquivo.

---

## Parte 2 — Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (pode ser público ou privado — se for privado, o GitHub Pages exige o plano Pro, então o mais simples é deixar público; os dados do casal ficam protegidos pelo Firebase mesmo assim, já que o código-fonte não expõe nenhuma senha).
2. Suba todos os arquivos desta pasta (`index.html`, a pasta `css/`, a pasta `js/` já com o `firebase-config.js` preenchido) para esse repositório. Pode ser pelo site do GitHub ("Add file → Upload files") ou via git:

   ```bash
   git init
   git add .
   git commit -m "Primeira versão do Dupla Sessão"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

3. No GitHub, vá em **Settings → Pages** do repositório.
4. Em **"Build and deployment"**, escolha **Source: Deploy from a branch**, branch **main**, pasta **/ (root)**. Salve.
5. Espere 1–2 minutos e o GitHub vai mostrar o link do site, algo como:
   `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`

---

## Como usar

- Um dos dois entra no site e clica em **"Criar conta do casal"**: preenche o nome do casal, o nome de cada pessoa, um e-mail e uma senha únicos.
- **Essa conta é compartilhada** — os dois usam o mesmo e-mail e senha, cada um no seu computador, e enxergam os mesmos dados.
- Adicionem filmes/séries em **"Para assistir"**, movam para **"Assistindo"** quando começarem (séries têm checklist de episódios por temporada), e ao terminar cada um dá uma nota de 0 a 10 — o app calcula a média do casal e guarda tudo em **"Histórico"**.

## Estrutura dos arquivos

```
index.html          → estrutura das telas
css/style.css        → visual (tema "ticket de cinema")
js/firebase-config.js → suas chaves do Firebase (preencher na Parte 1)
js/app.js             → toda a lógica do app
```

## Dúvidas comuns

- **"Erro ao criar conta / entrar"** → confira se copiou certinho os valores do `firebaseConfig` e se ativou o método E-mail/senha no passo 3.
- **Dados não aparecem no outro computador** → confirme que os dois estão logando com o mesmo e-mail/senha, e que as regras do Firestore (passo 5 da Parte 1) foram publicadas.
- **Quero trocar as cores/fonte** → tudo está em `css/style.css`, nas variáveis no topo do arquivo (`:root`).
