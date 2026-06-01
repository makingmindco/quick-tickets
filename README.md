# QuickTickets 🎫

Um sistema moderno e intuitivo de gestão e atendimento de chamados de suporte. O sistema possui painéis dedicados para alunos/usuários e administradores/técnicos, com foco em usabilidade, comunicação em tempo real e eficiência.

---

## 🚀 Funcionalidades

### 👤 Painel do Aluno / Usuário
* **Abertura de Chamados:** Interface simplificada para criação de chamados, classificação por categoria e definição de prioridades.
* **Acompanhamento e Chat:** Histórico de interações com o suporte técnico. O chat conta com reprodução de áudios no estilo WhatsApp (com barras de onda sonora dinâmicas), envio de mensagens de texto e cronômetro de tempo decorrido desde a abertura.
* **Configurações do Perfil:** Upload de foto de perfil (avatar) integrado e salvamento de preferências diretamente no banco de dados. O e-mail de cadastro é bloqueado para edição por motivos de segurança.
* **Tema Escuro Nativo:** Suporte a modo escuro persistente. As preferências de tema são associadas ao perfil do usuário no banco de dados, sendo sincronizadas em qualquer dispositivo.
* **Central de Notificações:** Indicador visual (sininho) na página inicial notificando o usuário sobre atualizações de status nos seus chamados, respostas de técnicos e novos avisos.
* **Ações Rápidas:** Solicitação de urgência e cancelamento de chamados diretamente pelo painel.

### 🔑 Painel do Administrador
* **Fila de Atendimento:** Centralização de chamados abertos, ordenados por prioridade e tempo de espera.
* **Gestão de Chamados:** Atribuição de técnicos responsáveis, atualização de status em tempo real e canal direto de conversa com o solicitante.
* **Mural de Avisos:** Criação de comunicados gerais que aparecem na central de notificações de todos os usuários cadastrados.
* **Configurações do Sistema:**
  * **Modo Manutenção:** Bloqueio temporário de novos chamados.
  * **Tempo de SLA:** Definição em horas do tempo máximo de atendimento.
  * **Gerenciamento de Categorias (CRUD):** Adição, edição e exclusão de categorias disponíveis para abertura de chamados.
  * **Configurações de Segurança:** Opção para ativar ou desativar novos cadastros de usuários e redefinição de senha no sistema.

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** [Next.js](https://nextjs.org/) (App Router & React Server/Client Components)
* **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) para design responsivo e customizado
* **Banco de Dados:** MySQL (utilizando `mysql2/promise` para conexões assíncronas)
* **Autenticação:** JWT (JSON Web Tokens) e criptografia de senhas com `bcrypt`
* **Notificações por E-mail:** `nodemailer` para simulação e envio de links de redefinição de senha
* **Icons:** `lucide-react`

---

## 📦 Instalação e Execução

### 1. Clonar o repositório
```bash
git clone https://github.com/makingmindco/quick-tickets.git
cd quick-tickets
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes chaves de acesso:

```env
DB_HOST=seu_host_mysql
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=seu_banco_de_dados

JWT_SECRET=sua_chave_secreta_jwt
```

*(O banco de dados irá criar automaticamente as tabelas e colunas necessárias, como `foto_url` e `tema_escuro`, na primeira execução da aplicação)*

### 4. Executar em Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

### 5. Compilar para Produção
```bash
npm run build
npm run start
```

---

## 📂 Estrutura de Pastas

```text
├── public/                 # Arquivos estáticos (imagens, ícones e uploads)
├── src/
│   ├── app/                # Rotas da aplicação (App Router) e rotas de API
│   │   ├── admin/          # Painel Administrativo
│   │   ├── dashboard/      # Painel do Aluno/Usuário
│   │   ├── api/            # Endpoints HTTP da aplicação
│   │   └── reset-password/ # Redefinição de senha
│   ├── components/         # Componentes React reutilizáveis (UI)
│   ├── lib/                # Configurações de banco, repositórios de dados e utilitários
│   │   ├── db.ts           # Inicialização e conexões do MySQL
│   │   └── repositories/   # Camada de persistência (usuarios, notificacoes, etc.)
│   └── types/              # Definições de tipos TypeScript
```
