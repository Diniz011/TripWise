# ✈️ TripWise

> 🚧 **Status do Projeto:** Em desenvolvimento ativo. Novas funcionalidades, melhorias de interface e aprimoramentos estão sendo implementados continuamente.

O **TripWise** é um aplicativo de planejamento e organização de viagens desenvolvido com **React Native** e **Expo Router**.

O objetivo é oferecer uma experiência completa para que os usuários possam organizar suas viagens em um só lugar, gerenciar orçamentos, planejar passeios e receber notificações importantes sobre suas viagens.

## ✨ Funcionalidades

### 🧳 Gerenciamento de Viagens

- Cadastro de viagens com destino, data e meio de transporte.
- Edição e exclusão de viagens.
- Visualização de informações detalhadas de cada viagem.
- Navegação entre a lista de viagens e seus respectivos detalhes.

### 💰 Controle Financeiro

- Definição de orçamento total por viagem.
- Registro e acompanhamento de gastos.
- Cálculo do saldo restante em tempo real.
- Valores formatados em Reais (R$).
- Notificações quando o orçamento atinge 80% ou ultrapassa o limite definido.

### 📍 Planejamento de Passeios

- Cadastro de pontos turísticos e atividades.
- Gerenciamento dos passeios planejados.
- Organização das atividades relacionadas a cada viagem.

### 🔔 Sistema de Notificações

- Notificações internas para eventos importantes:
  - Criação de viagens.
  - Atualização de viagens.
  - Exclusão de viagens.
  - Alterações em hospedagens.
  - Inclusão ou alterações de passeios.
  - Alertas relacionados ao orçamento.
- Preferências individuais para ativar ou desativar categorias de notificações.
- Lembretes locais automáticos de viagem, programados para um dia antes da data de partida, às 9h.
- Sincronização dos lembretes conforme as viagens e as preferências são atualizadas.
- Cancelamento dos lembretes quando uma viagem é excluída ou quando a preferência correspondente é desativada.

### 📬 Central de Notificações

- Tela dedicada para visualizar as notificações recebidas.
- Filtros para visualizar todas as notificações ou somente as não lidas.
- Contador dinâmico de notificações não lidas.
- Opção para marcar todas as notificações como lidas.
- Exclusão individual de notificações por gesto de deslizar para a esquerda (swipe).
- Exclusão de todas as notificações com confirmação.
- Abertura dos detalhes da viagem relacionada ao tocar em uma notificação.
- Atualização do contador de notificações na navegação do aplicativo.

### 🎨 Interface e Experiência do Usuário

- Interface moderna e intuitiva.
- Suporte automático a modo claro e modo escuro (Light Mode e Dark Mode).
- Tab Bar flutuante.
- Componentes com animações e interações.
- Seleção de datas com componente nativo.
- Interface adaptada à experiência do usuário em dispositivos móveis.

## 🛠️ Tecnologias Utilizadas

| Tecnologia                  | Aplicação                                          |
| --------------------------- | -------------------------------------------------- |
| React Native                | Desenvolvimento da interface mobile                |
| Expo                        | Ambiente e ferramentas de desenvolvimento          |
| Expo Router                 | Navegação baseada em arquivos                      |
| TypeScript                  | Tipagem estática e segurança no código             |
| AsyncStorage                | Persistência local de dados                        |
| Expo Notifications          | Gerenciamento e agendamento de notificações locais |
| React Native Animated       | Animações e interações da interface                |
| React Native DateTimePicker | Seleção de datas                                   |
| Ionicons                    | Ícones da interface                                |

## 📱 Como Executar o Projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/Diniz011/TripWise.git
```

### 2. Acessar a pasta do projeto

```bash
cd TripWise
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Iniciar o Expo

```bash
npx expo start
```

Após iniciar, utilize o QR Code para abrir o aplicativo em um dispositivo compatível com o Expo Go ou execute o projeto em um ambiente de desenvolvimento configurado.

## 🧪 Verificação do Código

Para verificar possíveis problemas de lint:

```bash
npx expo lint
```

Para verificar a tipagem TypeScript:

```bash
npx tsc --noEmit
```

## 💾 Armazenamento e Notificações

O aplicativo utiliza **AsyncStorage** para persistir localmente informações de viagens, preferências e notificações.

Os lembretes de viagem são programados localmente por meio do `expo-notifications`. Eles não dependem de um servidor de notificações push remoto.

> **Observação:** O suporte completo a notificações deve ser validado em uma Development Build, pois o Expo Go possui limitações para alguns recursos do `expo-notifications`.

## 👨‍💻 Desenvolvedor

**Cauê Diniz**

GitHub: [@Diniz011](https://github.com/Diniz011)

---

_TripWise — Sua próxima viagem começa com um bom planejamento._ ✈️
