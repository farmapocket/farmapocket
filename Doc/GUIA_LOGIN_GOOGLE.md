# 🔐 Guia Completo: Configurar Login com Google no FarmaPocket

## ⚠️ IMPORTANTE: URLs devem corresponder EXATAMENTE

O erro mais comum é **URL mismatch**. Toda URL que você usa no código DEVE estar cadastrada no Supabase e no Google Cloud Console.

---

## 📋 CHECKLIST (faça na ordem)

### ✅ PASSO 1: Configurar URL no Supabase

1. Acesse seu projeto no Supabase → **Authentication → URL Configuration**
2. Configure:

| Campo | Valor para Netlify | Valor para domínio próprio |
|---|---|---|
| **Site URL** | `https://farmapocket.netlify.app` | `https://farmapocket.com.br` |
| **Additional Redirect URLs** | `https://farmapocket.netlify.app/app.html` | `https://farmapocket.com.br/app.html` |
| | `http://localhost:3000/app.html` (para testes locais) | `http://localhost:3000/app.html` (para testes locais) |

> ⚠️ **ATENÇÃO**: As URLs devem ser EXATAS. Não pode faltar `/app.html` no final!

---

### ✅ PASSO 2: Configurar Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Vá em **APIs & Services → Credentials**
3. Clique no seu **OAuth 2.0 Client ID** (Web application)
4. Em **Authorized redirect URIs**, adicione:

```
https://SEU-PROJETO.supabase.co/auth/v1/callback
```

> Substitua `SEU-PROJETO` pelo ID do seu projeto Supabase (ex: `abcdefgh12345678`)

5. Em **Authorized JavaScript origins**, adicione:

```
https://farmapocket.netlify.app
https://farmapocket.com.br
http://localhost:3000
```

6. Clique em **Save**

---

### ✅ PASSO 3: Configurar Provider no Supabase

1. Supabase → **Authentication → Providers → Google**
2. **Enable Sign in with Google**: ON ✅
3. **Client ID**: cole o Client ID do Google Cloud (termina em `.apps.googleusercontent.com`)
4. **Client Secret**: cole o Secret do Google Cloud
5. Clique em **Save**

---

### ✅ PASSO 4: Verificar config.js

Edite `js/config.js` e confirme que está preenchido:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',  // ← preencha!
    SUPABASE_ANON_KEY: 'sua-anon-key-aqui',            // ← preencha!
    // ...
};
```

---

### ✅ PASSO 5: Testar

1. Abra o console do navegador (F12 → Console)
2. Acesse `https://farmapocket.netlify.app` (ou seu domínio)
3. Clique em "Entrar com Google"
4. Veja os logs no console:

```
🔐 Auth.init() started
📍 Current URL: https://farmapocket.netlify.app/index.html
📍 Origin: https://farmapocket.netlify.app
🔑 Starting Google Sign-In...
🔄 Redirect URL: https://farmapocket.netlify.app/app.html
🔄 Is localhost: false
✅ OAuth initiated: {url: "https://accounts.google.com/..."}
```

Se aparecer algum erro, ele será mostrado no console e na tela.

---

## 🐛 ERROS COMUNS

### "redirect_uri_mismatch"

**Causa**: A URL de redirect no código não está na lista do Google Cloud Console ou do Supabase.

**Solução**: Verifique se `https://SEU-PROJETO.supabase.co/auth/v1/callback` está em **Authorized redirect URIs** no Google Cloud Console.

---

### "Invalid characters. Google Client IDs should be..."

**Causa**: Você colocou o nome do app em vez do Client ID no Supabase.

**Solução**: O Client ID deve ser algo como `123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`

---

### "User cancelled the login process" (ou nada acontece)

**Causa**: O popup foi bloqueado ou o redirectTo está errado.

**Solução**: 
- Verifique se o popup do Google não foi bloqueado pelo navegador
- Confirme que `redirectTo` no código corresponde a uma URL na lista do Supabase

---

### "No active session" após login

**Causa**: O redirect para `app.html` não está funcionando ou a sessão não foi detectada.

**Solução**: 
- Verifique se `app.html` existe no seu projeto
- Confirme que o `redirectTo` termina em `/app.html`
- Abra o console em `app.html` e veja se aparece "🔄 Auth state changed: SIGNED_IN"

---

## 🔍 DEBUG

O `auth.js` agora tem logs detalhados. Abra o console (F12) e procure por:

| Log | Significado |
|---|---|
| `🔐 Auth.init() started` | Inicialização começou |
| `✅ Session found` | Já existe sessão ativa |
| `ℹ️ No active session` | Precisa fazer login |
| `🔑 Starting Google Sign-In...` | Botão clicado |
| `🔄 Redirect URL: ...` | URL que será usada para redirect |
| `✅ OAuth initiated` | Google aceitou, redirecionando... |
| `🔄 Auth state changed: SIGNED_IN` | Login bem-sucedido! |
| `❌ OAuth error` | Algo deu errado |

---

## 🚀 DEPLOY

Depois de tudo configurado, faça deploy no Netlify:

```bash
git add .
git commit -m "Configura login com Google"
git push
```

O Netlify atualiza automaticamente.

---

## 📞 Se ainda não funcionar

Me envie:
1. Um print do console do navegador (F12 → Console) após clicar em "Entrar com Google"
2. A URL exata que aparece no erro (se houver)
3. Confirme se as URLs do Supabase URL Configuration estão corretas
