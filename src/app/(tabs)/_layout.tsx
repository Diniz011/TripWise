import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { useCallback, useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";

const NOTIFICATIONS_STORAGE_KEY = "@tripwise_notificacoes";
const NOTIFICATIONS_CHANGED_EVENT = "tripwise:notificationsChanged";

type NotificationItem = {
  read: boolean;
};

export default function TabLayout() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const atualizarContador = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);

      if (!saved) {
        setUnreadCount(0);
        return;
      }

      const parsed: unknown = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        setUnreadCount(0);
        return;
      }

      const validNotifications = parsed.filter(
        (item): item is NotificationItem =>
          item !== null &&
          typeof item === "object" &&
          typeof item.read === "boolean",
      );

      const count = validNotifications.filter((item) => !item.read).length;

      setUnreadCount(count);
    } catch (error) {
      console.error("Erro ao atualizar contador de notificações:", error);
      setUnreadCount(0);
    }
  }, []);

  // Atualiza o contador ao trocar de tela.
  useEffect(() => {
    const timer = setTimeout(() => {
      void atualizarContador();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname, atualizarContador]);

  // Atualiza quando a lista de notificações é modificada.
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      NOTIFICATIONS_CHANGED_EVENT,
      () => {
        void atualizarContador();
      },
    );

    return () => {
      subscription.remove();
    };
  }, [atualizarContador]);

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

        {unreadCount > 0 && (
          <NativeTabs.Trigger.Badge>
            {String(unreadCount)}
          </NativeTabs.Trigger.Badge>
        )}
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
