# FARMAPOCKET - i18n Layer Guide
## Como usar o sistema de internacionalização

---

### 1. Visão Geral

A camada de i18n do FarmaPocket suporta **3 idiomas**:
- **en** - English (fallback padrão)
- **pt-BR** - Português (Brasil) - idioma padrão do app
- **es** - Español

O idioma selecionado é salvo no `localStorage` e persiste entre sessões.

---

### 2. Métodos Disponíveis

#### `i18n.t(key, replacements)`
Retorna a tradução de uma chave no idioma atual.

```javascript
// Uso básico
i18n.t('common.save');        // "Salvar" (pt-BR)
i18n.t('medication.name');    // "Nome" (pt-BR)

// Com placeholders (quando implementado)
i18n.t('common.greeting', { name: 'João' });
// "Olá, João!"
```

#### `i18n.setLanguage(lang)`
Altera o idioma do aplicativo e atualiza toda a UI automaticamente.

```javascript
i18n.setLanguage('en');     // Muda para inglês
i18n.setLanguage('pt-BR');  // Muda para português
i18n.setLanguage('es');     // Muda para espanhol
```

#### `i18n.getLanguage()`
Retorna o idioma atual.

```javascript
const currentLang = i18n.getLanguage();  // "pt-BR"
```

#### `i18n.getLanguages()`
Retorna o objeto com todos os idiomas disponíveis.

```javascript
const langs = i18n.getLanguages();
// { 'en': 'English', 'pt-BR': 'Português (BR)', 'es': 'Español' }
```

#### `i18n.refreshUI()`
Atualiza todos os elementos HTML que possuem o atributo `data-i18n`. Chamado automaticamente ao trocar de idioma.

---

### 3. Uso no HTML (Modo Declarativo)

O modo mais simples: adicione o atributo `data-i18n` aos elementos.

```html
<!-- Texto simples -->
<button data-i18n="common.save">Salvar</button>
<span data-i18n="medication.name">Nome</span>

<!-- Atributo (ex: placeholder de input) -->
<input type="text" 
       data-i18n="medication.name" 
       data-i18n-attr="placeholder" 
       placeholder="Nome">

<!-- Título de seção -->
<h2 data-i18n="nav.medications">Medicamentos</h2>
```

**Importante:** O texto dentro da tag é o fallback. Se a tradução não for encontrada, esse texto será exibido.

---

### 4. Uso no JavaScript (Modo Programático)

Para conteúdo dinâmico gerado via JS:

```javascript
// Criar elemento dinamicamente
const btn = document.createElement('button');
btn.setAttribute('data-i18n', 'common.add');
btn.textContent = i18n.t('common.add');
document.body.appendChild(btn);

// Ou usar diretamente
alert(i18n.t('common.success'));

// Em templates literais
const html = `
    <div class="card">
        <h3>${i18n.t('treatment.autonomy')}</h3>
        <p>${i18n.t('treatment.daysRemaining')}: 15</p>
    </div>
`;
```

---

### 5. Evento de Mudança de Idioma

Escute o evento `i18n:refresh` para atualizar conteúdo dinâmico:

```javascript
document.addEventListener('i18n:refresh', (e) => {
    console.log('Idioma alterado para:', e.detail.lang);

    // Recarregar dados traduzidos
    renderDashboard();
    renderMedicationList();
});
```

---

### 6. Exemplo Completo: Seletor de Idioma

```html
<!-- HTML -->
<select id="language-selector">
    <option value="pt-BR">Português (BR)</option>
    <option value="en">English</option>
    <option value="es">Español</option>
</select>
```

```javascript
// JavaScript
document.getElementById('language-selector').addEventListener('change', (e) => {
    i18n.setLanguage(e.target.value);
});
```

---

### 7. Convenção de Nomenclatura das Chaves

Todas as chaves seguem o padrão: `entidade.acao` ou `entidade.campo`

| Prefixo | Entidade |
|---------|----------|
| `app.*` | App geral |
| `common.*` | Textos compartilhados |
| `nav.*` | Navegação |
| `auth.*` | Autenticação |
| `medication.*` | Medicamentos |
| `treatment.*` | Tratamentos |
| `professional.*` | Profissionais de saúde |
| `symptom.*` | Sintomas |
| `event.*` | Eventos |
| `prescription.*` | Receituários |
| `settings.*` | Configurações |
| `dashboard.*` | Painel principal |

---

### 8. Adicionar Novo Idioma

Para adicionar um novo idioma (ex: fr - Francês):

1. Adicione à lista de idiomas:
```javascript
languages: {
    'en': 'English',
    'pt-BR': 'Português (BR)',
    'es': 'Español',
    'fr': 'Français'  // <-- novo
}
```

2. Adicione as traduções em cada chave:
```javascript
'common.save': {
    'en': 'Save',
    'pt-BR': 'Salvar',
    'es': 'Guardar',
    'fr': 'Enregistrer'  // <-- novo
}
```

---

### 9. Dicas Importantes

- **Sempre use `data-i18n`** em elementos estáticos do HTML — é zero código extra
- **Use `i18n.t()`** em conteúdo gerado por JavaScript
- **O fallback é sempre o inglês** — se uma tradução não existir no idioma atual, cai para `en`
- **Se nem em inglês existir**, a própria chave é retornada (ex: `medication.unknown`)
- **Não use innerHTML com i18n.t()** — use `textContent` para evitar XSS

---

### 10. Integração com Supabase

Os dados do banco (nomes de medicamentos, descrições) são inseridos pelo usuário e **não passam pela camada i18n**. A i18n traduz apenas a **interface do aplicativo**, não os dados.

Exceção: campos de domínio como `event_type` podem ter tradução:
```javascript
// No banco: event_type = 'Surgery'
// Na UI:
i18n.t('event.type.surgery');  // "Cirurgia" (pt-BR)
```
