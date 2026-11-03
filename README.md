# Gran Detail Studio Automotivo

Sistema interno responsivo para gestão de orçamentos da Gran Detail.

## Recursos

- painel de visão geral no padrão visual da referência;
- lista, busca, criação, edição e duplicação de orçamentos;
- armazenamento persistente no navegador;
- cadastro derivado de clientes e veículos, com histórico;
- serviços livres, total em centavos e condições alternativas de pagamento;
- PDF A4 com logo, múltiplas páginas e nome de arquivo descritivo;
- mensagem pronta para abrir no WhatsApp (o PDF deve ser anexado manualmente).

## Executar

```bash
npm install
npm run dev
```

## Verificações

```bash
npm run test
npm run build
```

Com o Supabase configurado, os orçamentos ficam no banco e cada usuário precisa entrar com e-mail e senha. Sem as variáveis de ambiente, os dados ficam no `localStorage` do navegador.

## Supabase

1. A migração `supabase/migrations/20261103150000_create_quotes.sql` já foi aplicada ao projeto informado. Em uma nova instalação, aplique-a com `supabase db push`.
2. Em Authentication > Users, crie o usuário da equipe com e-mail e senha. Cada conta vê apenas seus próprios orçamentos.
3. Copie `.env.example` para `.env.local` e preencha a URL do projeto e a chave publicável. Configure as mesmas variáveis na hospedagem, se aplicável, e gere uma nova build.
4. Entre no app e salve um orçamento. Recarregue a página para verificar a persistência.

Sem as variáveis, o app funciona no modo local. Ao ativar o Supabase, os orçamentos do navegador não são importados automaticamente. Clientes e veículos continuam derivados dos orçamentos, e a agenda fica vazia no modo conectado.
