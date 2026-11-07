import { NativeTabs } from "expo-router/native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs tintColor="#8FA255">
      {/* VIAGENS */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Viagens</NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          sf={{
            default: "airplane",
            selected: "airplane",
          }}
          md="flight"
        />
      </NativeTabs.Trigger>

      {/* NOTIFICAÇÕES */}
      <NativeTabs.Trigger name="notificacoes">
        <NativeTabs.Trigger.Label>Notificações</NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          sf={{
            default: "bell",
            selected: "bell.fill",
          }}
          md="notifications"
        />

        <NativeTabs.Trigger.Badge>21</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      {/* PERFIL */}
      <NativeTabs.Trigger name="perfil">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
          md="account_circle"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
