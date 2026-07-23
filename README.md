# Meus Pássaros 🐦

O **Meus Pássaros** é um aplicativo moderno e intuitivo desenvolvido para criadores de aves que buscam organização e eficiência no manejo de seu plantel. Focado em canários e outros pássaros, o app permite o controle total de aves, gaiolas, posturas e agenda de tarefas.

## ✨ Funcionalidades

- **Gestão de Aves**: Cadastro completo com nome, espécie, anilha, sexo, nascimento e status.
- **Controle de Gaiolas**: Organize suas aves por localização e número de gaiola.
- **Monitoramento de Posturas**: Acompanhe o ciclo reprodutivo, desde a postura até o nascimento dos filhotes.
- **Agenda de Tarefas**: Nunca esqueça de vacinas, medicações, limpezas ou ovoscopias.
- **Interface Premium**: Design moderno, otimizado para dispositivos móveis com tema claro e azul suave.
- **Sincronização em Nuvem**: Seus dados seguros e acessíveis de qualquer lugar via Supabase.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React.js com Vite.
- **Roteamento**: React Router DOM.
- **Backend & Banco de Dados**: Supabase (PostgreSQL).
- **Estilização**: CSS3 com variáveis modernas e Design Responsivo.
- **Ícones**: Tabler Icons.

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js instalado.
- Uma conta no [Supabase](https://supabase.com/).

### Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-seu-repositorio>
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🌐 Deploy (Netlify)

O projeto está pronto para ser publicado no Netlify.
- **Comando de Build**: `npm run build`
- **Diretório de Publicação**: `dist`
- **Importante**: Configure as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel do Netlify em *Site Configuration > Environment variables*.

## 📝 Banco de Dados

O esquema do banco de dados (tabelas e políticas de segurança RLS) pode ser encontrado no arquivo `Schema.sql`. Certifique-se de rodar este script no editor SQL do seu projeto Supabase.

---
Desenvolvido para facilitar a vida do criador de pássaros. 🐣
