# FarmaPocket v2

Seu Gerenciador Pessoal de Medicamentos — agora com suporte a múltiplos dependentes!

## ✨ Novidade: Dependentes

Agora você pode cadastrar **dependentes** (filhos, cônjuge, pais, etc.) e gerenciar medicamentos, tratamentos, sintomas e eventos para cada um deles.

### Como funciona:
- O usuário que faz login é o **account_owner** (dono da conta)
- O dono da conta pode cadastrar vários **dependentes**
- Cada dependente tem seus próprios medicamentos, tratamentos, profissionais, etc.
- O dashboard agrega dados de **todos os dependentes**
- As páginas de Medicamentos, Tratamentos e Profissionais mostram dados do **dependente selecionado**

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Supabase](https://supabase.com)
- Conta no [Netlify](https://netlify.com)

## 🚀 Configuração Rápida

### 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. No SQL Editor, execute o conteúdo do arquivo `schema_v2.sql`
3. Vá em **Authentication > Providers > Google** e habilite
4. Configure o OAuth do Google
5. Copie a **Project URL** e **anon public key** em Project Settings > API

### 2. Configurar o Projeto

1. Edite `js/config.js` e substitua:
   ```javascript
   SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
   SUPABASE_ANON_KEY: 'SUA-ANON-KEY-AQUI',
   ```

### 3. Publicar no Netlify

1. Acesse [netlify.com](https://netlify.com) e faça login com GitHub
2. Clique em **Add new site > Import an existing project**
3. Conecte seu repositório do GitHub
4. Deploy automático (site estático, sem build command)

## 🗄️ Modelo de Dados v2

```
auth.users (Supabase Auth)
    │
    └── owns ──► dependents (account_owner_id)
                     │
                     ├──► medications (dependent_id)
                     ├──► healthcare_professionals (dependent_id)
                     ├──► treatments (dependent_id)
                     ├──► symptoms (dependent_id)
                     ├──► events (dependent_id)
                     └──► prescriptions (dependent_id)
```

## 🔄 Fluxo de Uso

1. **Login** com Google
2. **Cadastrar dependentes** (incluindo você mesmo como "Eu mesmo")
3. **Selecionar dependente** no topo da tela
4. **Cadastrar medicamentos, tratamentos, etc.** para o dependente selecionado
5. **Dashboard** mostra resumo de todos os dependentes

## 📱 Instalar no Celular

### Android:
1. Abra o site no Chrome
2. Toque nos 3 pontos > "Adicionar à tela inicial"

### iOS:
1. Abra o site no Safari
2. Toque em "Compartilhar" > "Adicionar à Tela de Início"

## 🛡️ Segurança

- Autenticação via Google SSO
- Row Level Security (RLS) no banco de dados
- Cada usuário vê apenas seus próprios dependentes e dados
- HTTPS obrigatório

## 💰 Custo

| Fase | Custo |
|------|-------|
| Desenvolvimento | R$ 0 |
| Uso pessoal/família | R$ 0 |
| Se crescer muito | ~R$ 25/mês (Supabase Pro) |

## 🐛 Troubleshooting

**"Selecione um dependente primeiro"** → Cadastre pelo menos um dependente antes de adicionar medicamentos

**Erro de login:** Verifique se a URL de redirect no Supabase está correta

**Dados não aparecem:** Verifique se o RLS está configurado corretamente no schema

## 📄 Licença

Uso pessoal. Desenvolvido para gestão individual e familiar de medicamentos.
