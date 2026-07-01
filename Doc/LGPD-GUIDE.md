# LGPD para FarmaPocket - Guia de Implementação

## ⚠️ DISCLAIMER IMPORTANTE

Eu sou uma inteligência artificial, **não sou advogado**. Os documentos abaixo são **templates baseados em boas práticas e na LGPD** (Lei 13.709/2018), mas **não substituem assessoria jurídica**. Para um app que lida com dados de saúde, recomendo fortemente consultar um advogado especializado em proteção de dados.

---

## 📋 O que a LGPD exige de você

Como o FarmaPocket lida com **dados pessoais sensíveis** (saúde, medicamentos, tratamentos), você tem obrigações extras:

### 1. Base Legal
A LGPD exige uma justificativa para tratar dados. Para o FarmaPocket, a base é:
- **Consentimento** (Art. 7º, I) - usuário concorda ao usar o app
- **Legítimo interesse** (Art. 7º, IX) - para funcionamento básico

### 2. Dados Sensíveis (Art. 11º)
Dados de saúde exigem **tratamento reforçado**:
- Criptografia em trânsito (TLS/HTTPS) ✅ já tem
- Controle de acesso (RLS) ✅ já tem
- Não compartilhar com terceiros sem consentimento

### 3. Direitos do Titular (Art. 18º)
O usuário tem direito a:
- **Confirmar** se você tem dados dele
- **Acessar** os dados
- **Retificar** dados incorretos
- **Excluir** dados ("direito ao esquecimento")
- **Portar** dados para outro serviço
- **Revogar** consentimento

### 4. Transferência Internacional (Art. 33º)
O Supabase hospeda dados nos **EUA** (ou outro país). A LGPD exige:
- País com proteção adequada (EUA não tem decisão de adequação da ANPD)
- Ou: cláusulas contratuais padrão (SCCs) - Supabase já tem
- Ou: consentimento específico do usuário

> **Prática comum**: Na política de privacidade, informe que dados são hospedados fora do Brasil e que o Supabase garante proteção via SCCs.

### 5. Encarregado (DPO)
Apps de pequeno porte (pessoal/familiar) **podem não precisar** de DPO formal, mas é recomendado designar um responsável. Se você comercializar, aí sim precisa.

---

## ✅ Checklist de Implementação no App

### No código:
- [ ] Página/link para "Política de Privacidade"
- [ ] Página/link para "Termos de Uso"
- [ ] Checkbox de aceite no primeiro login (obrigatório)
- [ ] Botão "Excluir minha conta" nas configurações
- [ ] Botão "Exportar meus dados" nas configurações
- [ ] Link para contato/suporte

### No banco (Supabase):
- [ ] Campo `accepted_terms_at` na tabela de usuários (ou usar auth metadata)
- [ ] Campo `accepted_privacy_at` 
- [ ] Log de exclusão (quem pediu, quando)

### No Supabase Auth:
- [ ] Configurar "Delete User" para quando o usuário pedir exclusão
- [ ] Verificar se RLS apaga dados em cascata (ON DELETE CASCADE)

---

## 🎨 Como adicionar no App

### 1. Tela de Primeiro Acesso (após login Google)

Quando o usuário logar pela primeira vez, mostre um modal:

```
┌─────────────────────────────────────────┐
│  Bem-vindo ao FarmaPocket!              │
│                                         │
│  Para continuar, você precisa aceitar:  │
│                                         │
│  [ ] Termos de Uso                      │
│  [ ] Política de Privacidade            │
│                                         │
│  [Continuar]  [Sair]                    │
└─────────────────────────────────────────┘
```

### 2. Links no Footer (todas as telas)

```html
<footer class="text-center text-xs text-gray-400 py-4">
    <a href="/termos.html">Termos de Uso</a> • 
    <a href="/privacidade.html">Privacidade</a> • 
    <a href="mailto:contato@farmapocket.com.br">Contato</a>
</footer>
```

### 3. Configurações (exclusão de conta)

```
Configurações > Excluir Conta

⚠️ Esta ação é irreversível. Todos os seus dados
(medicamentos, tratamentos, dependentes) serão
permanentemente excluídos.

[Confirmar Exclusão]
```

---

## 📄 Templates

Veja os arquivos:
- `politica-privacidade.html` - Política de Privacidade completa
- `termos-de-uso.html` - Termos de Uso completos

---

## 🚀 Próximos passos

1. Substitua os placeholders (seu email, nome, etc.) nos templates
2. Adicione as páginas ao projeto
3. Implemente o modal de aceite no primeiro login
4. Adicione o botão "Excluir Conta" nas configurações
5. Teste o fluxo completo
6. (Recomendado) Leve para um advogado revisar antes de publicar
