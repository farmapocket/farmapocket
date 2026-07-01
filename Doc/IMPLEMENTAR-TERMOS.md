# Como Implementar Termos e Privacidade no FarmaPocket

## 📁 Arquivos criados

| Arquivo | Onde colocar | Função |
|---|---|---|
| `termos.html` | Raiz do projeto | Página de Termos de Uso |
| `privacidade.html` | Raiz do projeto | Página de Política de Privacidade |
| `js/terms.js` | Pasta `js/` | Lógica do modal de aceite |

---

## 🔧 Passo a passo de implementação

### 1. Copie os arquivos para o seu projeto

Coloque os 3 arquivos nas pastas corretas do seu repositório.

### 2. Adicione o modal no index.html

Antes de fechar o `</body>` do `index.html`, cole o HTML do modal (está no arquivo `modal-terms.html` ou copie do início deste guia).

### 3. Adicione o script terms.js

No `index.html`, adicione APÓS o `auth.js`:

```html
<script src="js/terms.js"></script>
```

### 4. Modifique o auth.js para verificar termos

No `auth.js`, na função `init()`, após detectar login, adicione:

```javascript
if (session) {
    // ... código existente ...

    // Verificar se aceitou termos
    const termsAccepted = await Terms.checkAccepted();
    if (!termsAccepted) {
        return; // Modal já está aberto, não redirecionar
    }

    // Só redireciona se aceitou
    window.location.href = 'app.html';
}
```

### 5. Adicione links no footer do app.html

No `app.html`, adicione no footer ou em algum menu:

```html
<a href="/termos.html" target="_blank">Termos de Uso</a>
<a href="/privacidade.html" target="_blank">Política de Privacidade</a>
```

### 6. Personalize os documentos

Abra `termos.html` e `privacidade.html` e substitua:
- `[Seu Nome]` → seu nome real
- `contato@farmapocket.com.br` → seu e-mail de contato
- `Santo Antônio da Patrulha, RS, Brasil` → sua cidade/estado

---

## ⚠️ IMPORTANTE

### Não esqueça de:

1. **Preencher seus dados reais** nos documentos (nome, e-mail, cidade)
2. **Revisar com advogado** antes de publicar (recomendado)
3. **Testar o fluxo**: faça login com uma conta nova e veja se o modal aparece
4. **Verificar no Supabase**: o aceite fica salvo no `user_metadata` do auth

### O que acontece na prática:

```
Usuário faz login com Google
        ↓
Verifica se aceitou termos (no user_metadata)
        ↓
Se NÃO aceitou → Mostra modal com checkboxes
        ↓
Usuário marca ambos → Clica "Continuar"
        ↓
Salva no Supabase (user_metadata)
        ↓
Redireciona para app.html
```

---

## 🚀 Deploy

Quando fizer deploy no Netlify (dia 1º), as páginas `termos.html` e `privacidade.html` estarão acessíveis em:
- `https://farmapocket.com.br/termos.html`
- `https://farmapocket.com.br/privacidade.html`

---

## 📋 Checklist final

- [ ] Arquivos `termos.html`, `privacidade.html` e `js/terms.js` no projeto
- [ ] Modal de aceite adicionado ao `index.html`
- [ ] Script `terms.js` carregado no `index.html`
- [ ] `auth.js` verifica termos antes de redirecionar
- [ ] Links nos Termos e Privacidade personalizados com seus dados
- [ ] Teste realizado com conta Google nova
- [ ] (Opcional) Advogado revisou os documentos
