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

Os dados ficam no `localStorage` do navegador. Para uso multiusuário ou em vários dispositivos, conecte o projeto a um banco de dados e autenticação.
