# Lácteo Gestão 1.0

Versão externa do sistema originalmente desenvolvido no Floot. A interface, as regras de negócio e a PWA foram preservadas; apenas o nome exibido foi alterado para **Lácteo Gestão** e a infraestrutura foi preparada para **Vercel + Supabase**.

## Estado da migração

- Interface React/Vite compilando para produção;
- Funções de servidor verificadas pelo TypeScript;
- PWA, manifest, ícones e modo standalone preservados;
- Esquema PostgreSQL extraído da base original em `supabase/migrations/001_initial_schema.sql`;
- Código original do Floot preservado nos diretórios `components`, `endpoints`, `helpers` e `pages`;
- Dados reais ainda não incluídos neste repositório público por segurança.

## Variáveis necessárias na Vercel

Copie `.env.example` e configure:

- `DATABASE_URL`: conexão PostgreSQL fornecida pelo Supabase;
- `JWT_SECRET`: chave aleatória com pelo menos 32 caracteres.

## Comandos

```bash
npm install
npm run build
npm run typecheck:server
npm run dev
```

## Publicação

1. Execute a migração SQL no projeto Supabase.
2. Importe o repositório na Vercel.
3. Cadastre `DATABASE_URL` e `JWT_SECRET` nas variáveis da Vercel.
4. Faça o deploy.
5. Transfira os dados reais diretamente da base Floot para o Supabase, sem adicioná-los ao GitHub.

O projeto original do Floot pode continuar sendo mantido separadamente durante a validação da versão 1.0.
