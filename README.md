# ✈️ TripWise

> 🚧 **Status do Projeto:** Em desenvolvimento ativo. Novas funcionalidades, melhorias de interface e aprimoramentos estão sendo implementados continuamente.

O **TripWise** é um aplicativo de planejamento e organização de viagens desenvolvido com **React Native**, **Expo** e **Expo Router**.

O objetivo é oferecer uma experiência completa para que os usuários possam organizar suas viagens em um só lugar, gerenciar orçamentos, planejar passeios, acompanhar despesas, configurar preferências pessoais e receber notificações importantes.

## ✨ Funcionalidades

### 🧳 Gerenciamento de Viagens

- Cadastro de viagens com destino, data e meio de transporte.
- Edição e exclusão de viagens.
- Visualização de informações detalhadas de cada viagem.
- Gerenciamento de informações de hospedagem, incluindo nome, endereço e período de estadia.
- Navegação entre a lista de viagens e seus respectivos detalhes.
- Persistência local das viagens.
- Validação dos dados recuperados do armazenamento para evitar registros inválidos e problemas na interface.

### 💰 Controle Financeiro

- Definição de orçamento total por viagem.
- Registro e acompanhamento de gastos individuais.
- Cálculo do saldo restante em tempo real.
- Acompanhamento do percentual do orçamento utilizado.
- Conversão e exibição dos valores conforme a moeda selecionada.
- Notificações quando o orçamento atinge 80% ou ultrapassa o limite definido.

### 💱 Sistema de Moedas

- Seleção entre três moedas: Real brasileiro (BRL), Dólar americano (USD) e Euro (EUR).
- Consulta de cotações cambiais por meio de uma API externa.
- Atualização manual das cotações.
- Conversão automática de orçamentos e despesas conforme a moeda selecionada.
- Formatação dos valores financeiros de acordo com a moeda escolhida.
- Persistência dos valores financeiros em Reais (BRL), utilizados como moeda-base para evitar conversões sucessivas e diferenças acumuladas.
- Armazenamento local da preferência de moeda selecionada.
- Gerenciamento das preferências e cotações por meio do `CurrencyContext`.

### 📍 Planejamento de Passeios

- Cadastro de pontos turísticos e atividades.
- Gerenciamento dos passeios planejados.
- Organização das atividades relacionadas a cada viagem.

### 👤 Perfil do Usuário

- Tela dedicada ao gerenciamento do perfil.
- Componente `ProfileIdentityCard` para apresentação da identidade do usuário.
- Organização das informações do perfil por meio de um serviço dedicado.
- Separação das responsabilidades relacionadas aos dados do perfil.
- Integração das informações do perfil à experiência do aplicativo.

### 🌎 Internacionalização

- Suporte a três idiomas:
  - Português (Brasil).
  - Inglês.
  - Espanhol.
- Seleção de idioma nas preferências do aplicativo.
- Organização das traduções por meio do `LanguageContext`.
- Atualização dos textos da interface conforme o idioma selecionado.
- Persistência da preferência de idioma entre sessões.

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
- Melhorias na organização e no gerenciamento das notificações.

### 🎨 Interface e Experiência do Usuário

- Interface moderna e intuitiva.
- Suporte a modo claro (Light Mode) e modo escuro (Dark Mode).
- Opção de aparência automática, acompanhando as configurações do dispositivo.
- Preferência de tema salva para manter a escolha do usuário entre sessões.
- Tab Bar flutuante.
- Componentes com animações e interações.
- Seleção de datas com componente nativo.
- Interface adaptada à experiência do usuário em dispositivos móveis.
- Melhorias na navegação e na organização dos componentes.
- Aprimoramentos de acessibilidade, incluindo identificação de elementos interativos.
- Melhorias na consistência visual e na experiência entre as telas.

## 🛠️ Tecnologias Utilizadas

| Tecnologia                  | Aplicação                                          |
| --------------------------- | -------------------------------------------------- |
| React Native                | Desenvolvimento da interface mobile                |
| Expo                        | Ambiente e ferramentas de desenvolvimento          |
| Expo Router                 | Navegação baseada em arquivos                      |
| TypeScript                  | Tipagem estática e segurança no código             |
| AsyncStorage                | Persistência local de dados e preferências         |
| Expo Notifications          | Gerenciamento e agendamento de notificações locais |
| React Native Animated       | Animações e interações da interface                |
| React Native DateTimePicker | Seleção de datas                                   |
| Ionicons                    | Ícones da interface                                |
| MaterialCommunityIcons      | Ícones complementares                              |
| ExchangeRate API            | Consulta de cotações cambiais                      |

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

## 💾 Armazenamento e Persistência

O aplicativo utiliza **AsyncStorage** para persistir localmente informações de viagens, orçamentos, gastos, preferências de aparência, idioma, moeda selecionada, dados do perfil e notificações, conforme os recursos implementados.

Os valores financeiros são armazenados internamente em Reais (BRL). A conversão para Dólar (USD) ou Euro (EUR) acontece conforme a moeda selecionada pelo usuário.

As cotações cambiais são consultadas por meio de uma API externa e armazenadas localmente para utilização no aplicativo.

Os dados recuperados do armazenamento passam por validações antes de serem utilizados pela interface, contribuindo para a estabilidade do aplicativo.

## 🔔 Notificações Locais

Os lembretes de viagem são programados localmente por meio do `expo-notifications`. Eles não dependem de um servidor de notificações push remoto.

> **Observação:** O suporte completo a notificações deve ser validado em uma Development Build, pois o Expo Go possui limitações para alguns recursos do `expo-notifications`.

## 👨‍💻 Desenvolvedor

**Cauê Diniz**

GitHub: [@Diniz011](https://github.com/Diniz011)

---

_TripWise — Sua próxima viagem começa com um bom planejamento._ ✈️
