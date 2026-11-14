# ✈️ TripWise

> 🚧 **Status do Projeto:** Em desenvolvimento ativo. Novas funcionalidades, melhorias de interface e aprimoramentos são implementados continuamente.

O **TripWise** é um aplicativo de planejamento e organização de viagens desenvolvido com **React Native**, **Expo** e **Expo Router**.

O objetivo é oferecer uma experiência completa para que os usuários possam organizar suas viagens em um só lugar, gerenciar orçamentos, planejar passeios, acompanhar despesas, configurar preferências pessoais, receber notificações, consultar informações climáticas e organizar seus documentos e roteiros de forma inteligente.

## ✨ Funcionalidades

### 🧳 Gerenciamento de Viagens

- Cadastro de viagens com destino, data e meio de transporte.
- Edição e exclusão de viagens.
- Visualização de informações detalhadas de cada viagem.
- Gerenciamento de informações de hospedagem, incluindo nome, endereço e período de estadia.
- Visualização das datas de início e término da viagem.
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

### 🗺️ Roteiro Inteligente

- Tela dedicada à organização do roteiro de viagem por dia.
- Cadastro e gerenciamento de atividades para cada data do roteiro.
- Organização das atividades por horário.
- Reordenação manual das atividades planejadas.
- Integração com as informações da viagem selecionada.
- Definição automática do período do roteiro com base nas datas da hospedagem, quando disponíveis.
- Utilização do período da viagem como referência quando não há datas de hospedagem cadastradas.
- Limite de planejamento de até 60 dias.
- Persistência local das atividades e dos roteiros.
- Suporte aos idiomas Português, Inglês e Espanhol.
- Suporte aos modos claro e escuro.

### 🗓️ Trip Timeline

- Tela dedicada à visualização da linha do tempo de cada viagem.
- Seleção da viagem para consultar sua respectiva Timeline.
- Tela de detalhes com informações relacionadas à viagem selecionada.
- Navegação entre a seleção de viagens e os detalhes por meio de uma estrutura Stack com Expo Router.
- Organização da navegação em rotas aninhadas.
- Integração com as informações da viagem selecionada.
- Carregamento otimizado dos dados ao retornar à tela.
- Preservação do conteúdo já carregado durante atualizações de dados.
- Suporte aos idiomas Português, Inglês e Espanhol.
- Suporte aos modos claro e escuro.

### ☑️ Checklist da Viagem

- Tela dedicada à organização dos itens necessários para a viagem.
- Gerenciamento dos itens do checklist.
- Organização dos itens para facilitar a preparação antes da partida.
- Acompanhamento dos itens concluídos e pendentes.
- Persistência local das informações por viagem.
- Interface integrada aos idiomas e temas do aplicativo.
- Atualização dinâmica do idioma dos itens padrão conforme a preferência selecionada no aplicativo, independentemente do idioma utilizado na criação da viagem.

### 🌤️ Clima Inteligente

- Tela dedicada à consulta de informações climáticas relacionadas à viagem.
- Integração com o planejamento da viagem selecionada.
- Apresentação das informações meteorológicas para auxiliar na preparação do viajante.
- Interface integrada aos idiomas Português, Inglês e Espanhol.
- Suporte aos modos claro e escuro.

### 🧳 Carteira de Viagem

- Tela dedicada à organização de informações importantes da viagem.
- Organização dos registros em três categorias:
  - Documentos.
  - Passagens.
  - Reservas.
- Cadastro, edição e exclusão de registros.
- Armazenamento de informações como título, detalhes, data, local e observações.
- Contadores para acompanhar os registros organizados.
- Persistência local dos dados associados a cada viagem.
- Suporte aos idiomas Português, Inglês e Espanhol.
- Suporte aos modos claro e escuro.

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
- Formatação de datas conforme a localidade selecionada.
- Internacionalização dos componentes de seleção de datas.
- Atualização dos itens padrão do Checklist conforme o idioma atualmente selecionado, mesmo quando a viagem foi criada em outro idioma.

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
- Sincronização das alterações na central de notificações.
- Preservação das notificações já carregadas ao retornar à tela, evitando carregamentos desnecessários e piscadas visuais.

### 🎨 Interface e Experiência do Usuário

- Interface moderna e intuitiva.
- Suporte a modo claro (Light Mode) e modo escuro (Dark Mode).
- Opção de aparência automática, acompanhando as configurações do dispositivo.
- Preferência de tema salva para manter a escolha do usuário entre sessões.
- Tab Bar flutuante.
- Componentes com animações e interações.
- Seleção de datas com componente nativo.
- Botões e elementos interativos com visual minimalista.
- Aprimoramentos visuais para uma experiência mais limpa e consistente.
- Interface adaptada à experiência do usuário em dispositivos móveis.
- Melhorias na navegação e na organização dos componentes.
- Aprimoramentos de acessibilidade, incluindo identificação de elementos interativos.
- Melhorias na consistência visual e na experiência entre as telas.
- Aprimoramento da estabilidade da navegação entre abas.
- Correção de piscadas visuais ao retornar às telas Timeline e Notificações.
- Preservação do conteúdo já carregado durante atualizações de dados ao recuperar o foco das telas.
- Melhorias no gerenciamento dos estados de carregamento, evitando a substituição desnecessária do conteúdo por indicadores de carregamento.
- Preservação das transições nativas do iOS e da experiência visual da Tab Bar.

## 🛠️ Tecnologias Utilizadas

| Tecnologia                  | Aplicação                                          |
| --------------------------- | -------------------------------------------------- |
| React Native                | Desenvolvimento da interface mobile                |
| Expo                        | Ambiente e ferramentas de desenvolvimento          |
| Expo Router                 | Navegação baseada em arquivos e estruturas Stack   |
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

O aplicativo utiliza **AsyncStorage** para persistir localmente informações de viagens, orçamentos, gastos, preferências de aparência, idioma, moeda selecionada, dados do perfil, notificações, roteiros, checklists, registros da Carteira de Viagem e informações relacionadas à Timeline, conforme os recursos implementados.

Os valores financeiros são armazenados internamente em Reais (BRL). A conversão para Dólar (USD) ou Euro (EUR) acontece conforme a moeda selecionada pelo usuário.

As cotações cambiais são consultadas por meio de uma API externa e armazenadas localmente para utilização no aplicativo.

Os dados recuperados do armazenamento passam por validações antes de serem utilizados pela interface, contribuindo para a estabilidade do aplicativo.

As telas que utilizam carregamento de dados ao recuperar o foco foram aprimoradas para preservar o conteúdo já apresentado, evitando indicadores de carregamento desnecessários e melhorando a experiência de navegação.

**Observação:** Os dados armazenados localmente pelo AsyncStorage não devem ser considerados um cofre criptografado para documentos ou informações altamente sensíveis.

## 🔔 Notificações Locais

Os lembretes de viagem são programados localmente por meio do `expo-notifications`. Eles não dependem de um servidor de notificações push remoto.

> **Observação:** O suporte completo a notificações deve ser validado em uma Development Build, pois o Expo Go possui limitações para alguns recursos do `expo-notifications`.

## 👨‍💻 Desenvolvedor

**Cauê Diniz**

GitHub: [@Diniz011](https://github.com/Diniz011)

---

_TripWise — Sua próxima viagem começa com um bom planejamento._ ✈️
