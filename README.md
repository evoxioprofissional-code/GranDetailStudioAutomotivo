# Gran Detail Studio Automotivo

Sistema interno responsivo para gestão do studio da Gran Detail.

## Recursos

- painel com recebimentos, ordens, agenda e orçamentos reais;
- agenda em calendário mensal com seleção de clientes e veículos cadastrados, inclusive quando o cliente tem mais de um carro;
- fluxo visual de serviços em cinco etapas, ligado à agenda e às ordens de serviço;
- cadastro de clientes e veículos, inclusive a partir de orçamentos;
- lista, busca, criação, edição e duplicação de orçamentos;
- ordens de serviço com vínculo opcional a orçamentos aprovados ou criação automática a partir de um agendamento;
- fotos privadas de antes e depois em cada ordem, com galeria e comparação visual;
- registro de recebimentos com vínculo opcional a ordens de serviço;
- lista de clientes sem atendimento concluído há mais de 30 dias;
- preparação de mensagens para WhatsApp;
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

Com o Supabase configurado, os dados ficam no banco e cada usuário precisa entrar com e-mail e senha. Sem as variáveis de ambiente, os dados ficam no `localStorage` do navegador.

## Supabase

1. As migrações em `supabase/migrations` já foram aplicadas ao projeto informado. Em uma nova instalação, aplique-as com `supabase db push`.
2. Para novas contas, envie um convite em Authentication > Users. Por padrão, cada conta vê apenas seus próprios dados. Uma conta administradora pode ser vinculada ao espaço de outra conta em `public.studio_memberships` por uma operação administrativa no banco; o usuário e o proprietário precisam existir em `auth.users`. O vínculo concede acesso completo aos mesmos registros e fotos.
3. Copie `.env.example` para `.env.local` e preencha a URL do projeto e a chave publicável. Configure as mesmas variáveis na hospedagem, se aplicável, e gere uma nova build.
4. Entre no app e salve um orçamento. Recarregue a página para verificar a persistência.

Sem as variáveis, o app funciona no modo local. Ao ativar o Supabase, os dados do navegador não são importados automaticamente.
