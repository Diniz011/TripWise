import { useLanguage } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Viagem = {
  id: string;
  nome: string;
  destino: string;
  transporte: string;
  data: string;
  dataFim?: string;
  hotelNome?: string;
  hotelEndereco?: string;
  hotelData?: string;
  passeios?: string | string[];
  orcamentoTotal?: string;
  gastos?: string | unknown[];
};

type PeriodoViagem = {
  inicio: string;
  fim: string;
};

type GeocodingResult = {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type GeocodingResponse = {
  results?: GeocodingResult[];
};

type ForecastResponse = {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
  };
  hourly?: {
    time?: string[];
    relative_humidity_2m?: number[];
  };
};

type DiaClima = {
  data: string;
  codigo: number;
  temperaturaMaxima: number;
  temperaturaMinima: number;
  probabilidadeChuva: number;
  precipitacao: number;
  vento: number;
  umidade: number | null;
};

const STORAGE_KEY = "@viagens";
const MAX_FORECAST_DAYS = 16;

const translations = {
  "pt-BR": {
    title: "Clima Inteligente",
    subtitle: "Prepare-se para o clima do seu destino",
    loadingTrip: "Carregando viagem...",
    loadingWeather: "Consultando previsão do tempo...",
    tripNotFound: "Não foi possível encontrar esta viagem.",
    destinationNotFound: "Não encontramos esse destino.",
    destinationError: "Não foi possível localizar o destino informado.",
    weatherError: "Não foi possível consultar a previsão do tempo.",
    noDates: "Não foi possível identificar o período da viagem.",
    noEndDate:
      "Cadastre a data final da viagem ou o período da hospedagem para consultar a previsão.",
    noForecast:
      "Ainda não há previsão disponível para o período da sua viagem.",
    noForecastDescription:
      "A previsão do tempo está disponível para até 16 dias. Consulte novamente quando a viagem estiver mais próxima.",
    forecastTitle: "Previsão da viagem",
    currentDestination: "Destino localizado",
    tripPeriod: "Período da viagem",
    weatherConditions: "Condições previstas",
    recommendations: "O que levar na mala",
    rain: "Chuva",
    wind: "Vento",
    humidity: "Umidade",
    precipitation: "Volume de chuva",
    feelsLike: "Sensação térmica",
    maximum: "Máxima",
    minimum: "Mínima",
    chanceOfRain: "Probabilidade de chuva",
    refresh: "Atualizar previsão",
    retry: "Tentar novamente",
    updated: "Previsão atualizada",
    unavailable: "Previsão indisponível",
    unavailableDescription:
      "Ainda não temos dados meteorológicos para este dia.",
    today: "Hoje",
    tomorrow: "Amanhã",
    sunny: "Ensolarado",
    mainlySunny: "Predominantemente ensolarado",
    partlyCloudy: "Parcialmente nublado",
    cloudy: "Nublado",
    foggy: "Neblina",
    drizzle: "Garoa",
    rainLight: "Chuva fraca",
    rainModerate: "Chuva moderada",
    rainHeavy: "Chuva forte",
    snow: "Neve",
    showers: "Pancadas de chuva",
    snowShowers: "Pancadas de neve",
    thunderstorm: "Tempestade",
    unknown: "Condição desconhecida",
    lightClothes: "Roupas leves e confortáveis",
    sunscreen: "Protetor solar e óculos de sol",
    hat: "Boné ou chapéu",
    warmClothes: "Casaco ou blusa para se aquecer",
    umbrella: "Guarda-chuva ou capa de chuva",
    waterproofShoes: "Calçados resistentes à água",
    windbreaker: "Jaqueta corta-vento",
    layers: "Roupas em camadas",
    comfortableShoes: "Calçados confortáveis",
    goodWeather: "Condições favoráveis para passeios ao ar livre.",
    rainyWeather:
      "A possibilidade de chuva é alta. Planeje alternativas em ambientes cobertos.",
    coldWeather:
      "As temperaturas estarão mais baixas. Leve roupas para se aquecer.",
    hotWeather:
      "As temperaturas estarão elevadas. Priorize roupas leves e hidratação.",
    windyWeather:
      "O vento pode ser intenso. Considere levar uma proteção adequada.",
    moderateWeather:
      "Considere peças versáteis para diferentes momentos do dia.",
    weatherDisclaimer:
      "A previsão pode mudar conforme a data se aproxima. Consulte novamente antes de viajar.",
    days: "dias",
    degrees: "°",
    kmh: "km/h",
    mm: "mm",
    percent: "%",
    errorTitle: "Ops! Algo deu errado",
    back: "Voltar",
  },
  en: {
    title: "Smart Weather",
    subtitle: "Get ready for the weather at your destination",
    loadingTrip: "Loading trip...",
    loadingWeather: "Checking weather forecast...",
    tripNotFound: "This trip could not be found.",
    destinationNotFound: "We couldn't find this destination.",
    destinationError: "Unable to locate the destination.",
    weatherError: "Unable to retrieve the weather forecast.",
    noDates: "Unable to identify the trip dates.",
    noEndDate:
      "Add the trip end date or accommodation period to check the forecast.",
    noForecast: "No forecast is available for your trip dates yet.",
    noForecastDescription:
      "Weather forecasts are available for up to 16 days. Check again closer to your trip.",
    forecastTitle: "Trip forecast",
    currentDestination: "Located destination",
    tripPeriod: "Trip period",
    weatherConditions: "Expected conditions",
    recommendations: "What to pack",
    rain: "Rain",
    wind: "Wind",
    humidity: "Humidity",
    precipitation: "Rainfall",
    feelsLike: "Feels like",
    maximum: "High",
    minimum: "Low",
    chanceOfRain: "Chance of rain",
    refresh: "Refresh forecast",
    retry: "Try again",
    updated: "Forecast updated",
    unavailable: "Forecast unavailable",
    unavailableDescription: "Weather data is not available for this day yet.",
    today: "Today",
    tomorrow: "Tomorrow",
    sunny: "Sunny",
    mainlySunny: "Mainly sunny",
    partlyCloudy: "Partly cloudy",
    cloudy: "Cloudy",
    foggy: "Foggy",
    drizzle: "Drizzle",
    rainLight: "Light rain",
    rainModerate: "Moderate rain",
    rainHeavy: "Heavy rain",
    snow: "Snow",
    showers: "Rain showers",
    snowShowers: "Snow showers",
    thunderstorm: "Thunderstorm",
    unknown: "Unknown conditions",
    lightClothes: "Light and comfortable clothing",
    sunscreen: "Sunscreen and sunglasses",
    hat: "Cap or hat",
    warmClothes: "A warm jacket or sweater",
    umbrella: "Umbrella or raincoat",
    waterproofShoes: "Water-resistant footwear",
    windbreaker: "Windbreaker jacket",
    layers: "Layered clothing",
    comfortableShoes: "Comfortable footwear",
    goodWeather: "Favorable conditions for outdoor activities.",
    rainyWeather:
      "There is a high chance of rain. Plan some indoor alternatives.",
    coldWeather: "Temperatures will be lower. Pack warm clothing.",
    hotWeather:
      "Temperatures will be high. Choose light clothing and stay hydrated.",
    windyWeather: "Winds may be strong. Consider bringing suitable protection.",
    moderateWeather:
      "Consider versatile clothing for different times of the day.",
    weatherDisclaimer:
      "Forecasts can change as your trip approaches. Check again before traveling.",
    days: "days",
    degrees: "°",
    kmh: "km/h",
    mm: "mm",
    percent: "%",
    errorTitle: "Oops! Something went wrong",
    back: "Go back",
  },
  es: {
    title: "Clima Inteligente",
    subtitle: "Prepárate para el clima de tu destino",
    loadingTrip: "Cargando viaje...",
    loadingWeather: "Consultando el pronóstico del tiempo...",
    tripNotFound: "No se pudo encontrar este viaje.",
    destinationNotFound: "No encontramos este destino.",
    destinationError: "No fue posible localizar el destino indicado.",
    weatherError: "No fue posible consultar el pronóstico del tiempo.",
    noDates: "No fue posible identificar las fechas del viaje.",
    noEndDate:
      "Añade la fecha de finalización del viaje o el período del alojamiento para consultar el pronóstico.",
    noForecast:
      "Todavía no hay pronóstico disponible para las fechas de tu viaje.",
    noForecastDescription:
      "El pronóstico está disponible para hasta 16 días. Vuelve a consultar cuando se acerque el viaje.",
    forecastTitle: "Pronóstico del viaje",
    currentDestination: "Destino localizado",
    tripPeriod: "Período del viaje",
    weatherConditions: "Condiciones previstas",
    recommendations: "Qué llevar en la maleta",
    rain: "Lluvia",
    wind: "Viento",
    humidity: "Humedad",
    precipitation: "Precipitación",
    feelsLike: "Sensación térmica",
    maximum: "Máxima",
    minimum: "Mínima",
    chanceOfRain: "Probabilidad de lluvia",
    refresh: "Actualizar pronóstico",
    retry: "Intentar de nuevo",
    updated: "Pronóstico actualizado",
    unavailable: "Pronóstico no disponible",
    unavailableDescription:
      "Todavía no hay datos meteorológicos para este día.",
    today: "Hoy",
    tomorrow: "Mañana",
    sunny: "Soleado",
    mainlySunny: "Mayormente soleado",
    partlyCloudy: "Parcialmente nublado",
    cloudy: "Nublado",
    foggy: "Neblina",
    drizzle: "Llovizna",
    rainLight: "Lluvia ligera",
    rainModerate: "Lluvia moderada",
    rainHeavy: "Lluvia fuerte",
    snow: "Nieve",
    showers: "Chubascos",
    snowShowers: "Nevadas",
    thunderstorm: "Tormenta",
    unknown: "Condición desconocida",
    lightClothes: "Ropa ligera y cómoda",
    sunscreen: "Protector solar y gafas de sol",
    hat: "Gorra o sombrero",
    warmClothes: "Abrigo o suéter",
    umbrella: "Paraguas o impermeable",
    waterproofShoes: "Calzado resistente al agua",
    windbreaker: "Chaqueta cortavientos",
    layers: "Ropa en capas",
    comfortableShoes: "Calzado cómodo",
    goodWeather: "Condiciones favorables para actividades al aire libre.",
    rainyWeather:
      "Hay una alta probabilidad de lluvia. Planifica alternativas en interiores.",
    coldWeather: "Las temperaturas serán bajas. Lleva ropa de abrigo.",
    hotWeather:
      "Las temperaturas serán altas. Prioriza ropa ligera e hidratación.",
    windyWeather:
      "El viento puede ser intenso. Considera llevar protección adecuada.",
    moderateWeather:
      "Considera prendas versátiles para diferentes momentos del día.",
    weatherDisclaimer:
      "El pronóstico puede cambiar a medida que se acerca el viaje. Consulta de nuevo antes de viajar.",
    days: "días",
    degrees: "°",
    kmh: "km/h",
    mm: "mm",
    percent: "%",
    errorTitle: "¡Ups! Algo salió mal",
    back: "Volver",
  },
};

function normalizeLanguage(language: string) {
  if (language === "en" || language === "es") return language;
  return "pt-BR";
}

function parseDate(value?: string, referenceYear?: number): string | null {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return trimmed;
  }

  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (!brMatch) return null;

  const day = Number(brMatch[1]);
  const month = Number(brMatch[2]);
  let year = brMatch[3] ? Number(brMatch[3]) : referenceYear;

  if (!year) {
    const today = new Date();
    year = today.getFullYear();

    const candidate = new Date(Date.UTC(year, month - 1, day));
    const todayUtc = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
    );

    if (candidate < todayUtc) year += 1;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(dateString: string, amount: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getTripPeriod(viagem: Viagem): PeriodoViagem | null {
  const inicio = parseDate(viagem.data);
  if (!inicio) return null;

  let fim: string | null = null;

  if (viagem.hotelData && typeof viagem.hotelData === "string") {
    const partes = viagem.hotelData.split(/\s+a\s+/i);

    if (partes.length >= 2) {
      const anoInicio = Number(inicio.slice(0, 4));
      fim = parseDate(partes[1], anoInicio);

      if (fim && fim < inicio) {
        fim = parseDate(partes[1], anoInicio + 1);
      }
    }
  }

  if (!fim && viagem.dataFim) {
    const anoInicio = Number(inicio.slice(0, 4));
    fim = parseDate(viagem.dataFim, anoInicio);

    if (fim && fim < inicio) {
      fim = parseDate(viagem.dataFim, anoInicio + 1);
    }
  }

  if (!fim || fim < inicio) return null;
  return { inicio, fim };
}

function getWeatherDescription(
  code: number,
  t: (typeof translations)["pt-BR"],
) {
  if (code === 0) return t.sunny;
  if (code === 1) return t.mainlySunny;
  if (code === 2) return t.partlyCloudy;
  if (code === 3) return t.cloudy;
  if (code === 45 || code === 48) return t.foggy;
  if ([51, 53, 55, 56, 57].includes(code)) return t.drizzle;
  if (code === 61) return t.rainLight;
  if (code === 63) return t.rainModerate;
  if ([65, 66, 67].includes(code)) return t.rainHeavy;
  if ([71, 73, 75, 77].includes(code)) return t.snow;
  if ([80, 81, 82].includes(code)) return t.showers;
  if ([85, 86].includes(code)) return t.snowShowers;
  if ([95, 96, 99].includes(code)) return t.thunderstorm;
  return t.unknown;
}

function getWeatherIcon(code: number): keyof typeof Ionicons.glyphMap {
  if (code === 0) return "sunny";
  if (code === 1 || code === 2) return "partly-sunny";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "cloud";
  if ([51, 53, 55, 56, 57].includes(code)) return "rainy";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rainy";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunderstorm";
  return "cloud-outline";
}

function formatDate(dateString: string, locale: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function getRecommendations(dia: DiaClima, t: (typeof translations)["pt-BR"]) {
  const items: string[] = [];

  if (dia.temperaturaMaxima >= 28) {
    items.push(t.lightClothes, t.sunscreen, t.hat);
  } else if (dia.temperaturaMinima <= 12) {
    items.push(t.warmClothes, t.layers);
  } else if (dia.temperaturaMinima <= 18) {
    items.push(t.layers);
  } else {
    items.push(t.lightClothes, t.comfortableShoes);
  }

  if (dia.probabilidadeChuva >= 50 || dia.precipitacao >= 2) {
    items.push(t.umbrella, t.waterproofShoes);
  }

  if (dia.vento >= 30) items.push(t.windbreaker);

  return [...new Set(items)];
}

export default function ClimaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { language, locale } = useLanguage();
  const currentLanguage = normalizeLanguage(language);
  const t = translations[currentLanguage];
  const viagemId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [viagem, setViagem] = useState<Viagem | null>(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [localizacao, setLocalizacao] = useState<GeocodingResult | null>(null);
  const [dias, setDias] = useState<DiaClima[]>([]);

  const colors = useMemo(
    () => ({
      background: isDark ? "#121212" : "#F4F6FA",
      card: isDark ? "#1E1E1E" : "#FFFFFF",
      text: isDark ? "#FFFFFF" : "#172033",
      secondary: isDark ? "#A0A0A0" : "#7B8495",
      border: isDark ? "#333333" : "#E8EBF1",
      accent: "#8FA255",
      accentSoft: isDark ? "#29321E" : "#EEF2E5",
      warning: "#E5A33D",
      warningSoft: isDark ? "#3A2F1D" : "#FFF4DF",
      blue: "#5D9CEC",
      blueSoft: isDark ? "#1D2B3A" : "#EAF3FF",
    }),
    [isDark],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 18,
        },
        headerBackButton: {
          width: 42,
          height: 42,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          alignItems: "center",
          justifyContent: "center",
        },
        headerTitleContainer: {
          flex: 1,
          alignItems: "center",
          paddingHorizontal: 8,
        },
        headerTitle: {
          fontSize: 19,
          fontWeight: "800",
          color: colors.text,
        },
        headerSubtitle: {
          fontSize: 12,
          color: colors.secondary,
          marginTop: 3,
        },
        headerSpacer: {
          width: 42,
        },
        content: {
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 36,
        },
        destinationCard: {
          backgroundColor: colors.card,
          borderRadius: 22,
          padding: 19,
          marginBottom: 18,
          borderWidth: 1,
          borderColor: colors.border,
        },
        destinationTop: {
          flexDirection: "row",
          alignItems: "center",
        },
        destinationIcon: {
          width: 43,
          height: 43,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
          marginRight: 12,
        },
        destinationLabel: {
          color: colors.secondary,
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.8,
        },
        destinationName: {
          color: colors.text,
          fontSize: 18,
          fontWeight: "800",
          marginTop: 3,
        },
        destinationCountry: {
          color: colors.secondary,
          fontSize: 13,
          marginTop: 3,
        },
        periodRow: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: 18,
          paddingTop: 15,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        periodText: {
          color: colors.secondary,
          fontSize: 13,
          marginLeft: 8,
          flex: 1,
        },
        sectionTitle: {
          color: colors.text,
          fontSize: 19,
          fontWeight: "800",
          marginBottom: 13,
          letterSpacing: -0.3,
        },
        dayCard: {
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 17,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        dayHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 15,
        },
        dayName: {
          color: colors.text,
          fontSize: 15,
          fontWeight: "800",
          textTransform: "capitalize",
        },
        dayCondition: {
          color: colors.secondary,
          fontSize: 12,
          marginTop: 4,
        },
        weatherMain: {
          flexDirection: "row",
          alignItems: "center",
        },
        weatherIconContainer: {
          width: 58,
          height: 58,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
          marginRight: 13,
        },
        temperatureRange: {
          color: colors.text,
          fontSize: 23,
          fontWeight: "800",
          letterSpacing: -0.6,
        },
        temperatureLabels: {
          color: colors.secondary,
          fontSize: 11,
          marginTop: 3,
        },
        metrics: {
          flexDirection: "row",
          marginTop: 17,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          justifyContent: "space-between",
        },
        metric: {
          flex: 1,
          alignItems: "center",
        },
        metricIcon: {
          marginBottom: 6,
        },
        metricValue: {
          color: colors.text,
          fontSize: 13,
          fontWeight: "800",
        },
        metricLabel: {
          color: colors.secondary,
          fontSize: 10,
          marginTop: 3,
        },
        recommendationCard: {
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 18,
          marginTop: 8,
          marginBottom: 18,
          borderWidth: 1,
          borderColor: colors.border,
        },
        recommendationHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 13,
        },
        recommendationIcon: {
          width: 38,
          height: 38,
          borderRadius: 13,
          backgroundColor: colors.accentSoft,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 11,
        },
        recommendationTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: "800",
        },
        recommendationItem: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: 11,
        },
        recommendationText: {
          color: colors.text,
          fontSize: 13,
          marginLeft: 10,
          flex: 1,
        },
        unavailableCard: {
          backgroundColor: colors.warningSoft,
          borderRadius: 18,
          padding: 17,
          marginTop: 4,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "flex-start",
        },
        unavailableTitle: {
          color: colors.text,
          fontSize: 14,
          fontWeight: "800",
          marginBottom: 5,
        },
        unavailableText: {
          color: colors.secondary,
          fontSize: 12,
          lineHeight: 18,
        },
        notice: {
          color: colors.secondary,
          fontSize: 11,
          lineHeight: 17,
          marginTop: 5,
          marginBottom: 17,
        },
        refreshButton: {
          minHeight: 51,
          borderRadius: 15,
          backgroundColor: colors.accent,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 7,
        },
        refreshButtonText: {
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: "800",
          marginLeft: 9,
        },
        centerState: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          backgroundColor: colors.background,
        },
        stateTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: "800",
          textAlign: "center",
          marginTop: 16,
        },
        stateText: {
          color: colors.secondary,
          fontSize: 14,
          lineHeight: 21,
          textAlign: "center",
          marginTop: 8,
        },
        retryButton: {
          marginTop: 20,
          backgroundColor: colors.accent,
          paddingHorizontal: 25,
          paddingVertical: 13,
          borderRadius: 13,
        },
        retryText: {
          color: "#FFFFFF",
          fontWeight: "800",
          fontSize: 14,
        },
        loadingText: {
          color: colors.secondary,
          fontSize: 14,
          marginTop: 15,
        },
      }),
    [colors],
  );

  useEffect(() => {
    let active = true;

    async function carregarViagem() {
      try {
        setTripLoading(true);

        if (!viagemId) {
          if (active) setError(t.tripNotFound);
          return;
        }

        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (!stored) {
          if (active) setError(t.tripNotFound);
          return;
        }

        const parsed: unknown = JSON.parse(stored);

        if (!Array.isArray(parsed)) {
          if (active) setError(t.tripNotFound);
          return;
        }

        const encontrada = parsed.find(
          (item): item is Viagem =>
            item !== null &&
            typeof item === "object" &&
            String((item as Viagem).id) === String(viagemId),
        );

        if (!encontrada) {
          if (active) setError(t.tripNotFound);
          return;
        }

        if (active) {
          setViagem(encontrada);
          setError("");
        }
      } catch {
        if (active) setError(t.tripNotFound);
      } finally {
        if (active) setTripLoading(false);
      }
    }

    carregarViagem();

    return () => {
      active = false;
    };
  }, [viagemId, t.tripNotFound]);

  const carregarClima = useCallback(async () => {
    if (!viagem) {
      setRefreshing(false);
      return;
    }

    const periodo = getTripPeriod(viagem);

    if (!periodo) {
      setError(viagem.dataFim || viagem.hotelData ? t.noDates : t.noEndDate);
      setDias([]);
      setLocalizacao(null);
      setWeatherLoading(false);
      setRefreshing(false);
      return;
    }

    setWeatherLoading(true);
    setError("");

    try {
      const destino = viagem.destino?.trim();

      if (!destino) {
        throw new Error(t.destinationNotFound);
      }

      const geocodingUrl =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destino)}` +
        `&count=5&language=${currentLanguage === "pt-BR" ? "pt" : currentLanguage}&format=json`;

      const geocodingResponse = await fetch(geocodingUrl);

      if (!geocodingResponse.ok) {
        throw new Error(t.destinationError);
      }

      const geocodingData =
        (await geocodingResponse.json()) as GeocodingResponse;

      const resultado = geocodingData.results?.[0];

      if (
        !resultado ||
        typeof resultado.latitude !== "number" ||
        typeof resultado.longitude !== "number"
      ) {
        throw new Error(t.destinationNotFound);
      }

      setLocalizacao(resultado);

      const forecastUrl =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${resultado.latitude}` +
        `&longitude=${resultado.longitude}` +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max" +
        "&hourly=relative_humidity_2m" +
        "&forecast_days=16" +
        "&timezone=auto" +
        "&temperature_unit=celsius" +
        "&wind_speed_unit=kmh" +
        "&precipitation_unit=mm";

      const forecastResponse = await fetch(forecastUrl);

      if (!forecastResponse.ok) {
        throw new Error(t.weatherError);
      }

      const forecast = (await forecastResponse.json()) as ForecastResponse;
      const daily = forecast.daily;

      if (
        !daily?.time ||
        !daily.weather_code ||
        !daily.temperature_2m_max ||
        !daily.temperature_2m_min
      ) {
        throw new Error(t.weatherError);
      }

      const hourlyTimes = forecast.hourly?.time ?? [];
      const hourlyHumidity = forecast.hourly?.relative_humidity_2m ?? [];
      const humidityByDate = new Map<string, number[]>();

      hourlyTimes.forEach((time, index) => {
        const humidity = hourlyHumidity[index];

        if (typeof humidity !== "number" || !Number.isFinite(humidity)) {
          return;
        }

        const date = time.slice(0, 10);
        const values = humidityByDate.get(date) ?? [];

        values.push(humidity);
        humidityByDate.set(date, values);
      });

      const previsao: DiaClima[] = daily.time
        .map((date, index) => {
          const maxima = daily.temperature_2m_max?.[index];
          const minima = daily.temperature_2m_min?.[index];
          const codigo = daily.weather_code?.[index];

          if (
            typeof maxima !== "number" ||
            !Number.isFinite(maxima) ||
            typeof minima !== "number" ||
            !Number.isFinite(minima) ||
            typeof codigo !== "number"
          ) {
            return null;
          }

          const humidityValues = humidityByDate.get(date) ?? [];
          const humidity =
            humidityValues.length > 0
              ? humidityValues.reduce((sum, value) => sum + value, 0) /
                humidityValues.length
              : null;

          const probability = daily.precipitation_probability_max?.[index];
          const precipitation = daily.precipitation_sum?.[index];
          const wind = daily.wind_speed_10m_max?.[index];

          return {
            data: date,
            codigo,
            temperaturaMaxima: maxima,
            temperaturaMinima: minima,
            probabilidadeChuva:
              typeof probability === "number" && Number.isFinite(probability)
                ? probability
                : 0,
            precipitacao:
              typeof precipitation === "number" &&
              Number.isFinite(precipitation)
                ? precipitation
                : 0,
            vento: typeof wind === "number" && Number.isFinite(wind) ? wind : 0,
            umidade: humidity,
          };
        })
        .filter(
          (dia): dia is DiaClima =>
            dia !== null &&
            dia.data >= periodo.inicio &&
            dia.data <= periodo.fim,
        );

      setDias(previsao);
    } catch (err) {
      setDias([]);
      setError(
        err instanceof Error && err.message ? err.message : t.weatherError,
      );
    } finally {
      setWeatherLoading(false);
      setRefreshing(false);
    }
  }, [
    viagem,
    currentLanguage,
    t.noDates,
    t.noEndDate,
    t.destinationNotFound,
    t.destinationError,
    t.weatherError,
  ]);

  useEffect(() => {
    if (!viagem) return;

    const timeoutId = setTimeout(() => {
      void carregarClima();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [viagem, carregarClima]);

  const periodo = useMemo(
    () => (viagem ? getTripPeriod(viagem) : null),
    [viagem],
  );

  const diasIndisponiveis = useMemo(() => {
    if (!periodo) return 0;

    const hoje = new Date();
    const hojeUtc = [
      hoje.getFullYear(),
      String(hoje.getMonth() + 1).padStart(2, "0"),
      String(hoje.getDate()).padStart(2, "0"),
    ].join("-");

    const limite = addDays(hojeUtc, MAX_FORECAST_DAYS - 1);
    const inicioIndisponivel =
      periodo.inicio > limite ? periodo.inicio : addDays(limite, 1);

    if (periodo.fim < inicioIndisponivel) return 0;

    const inicioParts = inicioIndisponivel.split("-").map(Number);
    const fimParts = periodo.fim.split("-").map(Number);

    const inicioDate = Date.UTC(
      inicioParts[0],
      inicioParts[1] - 1,
      inicioParts[2],
    );
    const fimDate = Date.UTC(fimParts[0], fimParts[1] - 1, fimParts[2]);

    return Math.floor((fimDate - inicioDate) / 86400000) + 1;
  }, [periodo]);

  const localeDate =
    locale || (currentLanguage === "pt-BR" ? "pt-BR" : currentLanguage);

  const onRefresh = useCallback(() => {
    if (weatherLoading) return;

    setRefreshing(true);
    carregarClima();
  }, [carregarClima, weatherLoading]);

  const voltar = () => router.back();

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.back}
        onPress={voltar}
        style={styles.headerBackButton}
        hitSlop={6}
      >
        <Ionicons name="chevron-back" size={23} color={colors.text} />
      </Pressable>

      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t.title}
        </Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>
          {t.subtitle}
        </Text>
      </View>

      <View style={styles.headerSpacer} />
    </View>
  );

  if (tripLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        {renderHeader()}
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{t.loadingTrip}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !viagem) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        {renderHeader()}
        <View style={styles.centerState}>
          <Ionicons
            name="alert-circle-outline"
            size={52}
            color={colors.secondary}
          />
          <Text style={styles.stateTitle}>{t.errorTitle}</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={voltar}
          >
            <Text style={styles.retryText}>{t.back}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (weatherLoading && !localizacao) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        {renderHeader()}
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{t.loadingWeather}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && viagem) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        {renderHeader()}
        <View style={styles.centerState}>
          <Ionicons
            name="cloud-offline-outline"
            size={52}
            color={colors.secondary}
          />
          <Text style={styles.stateTitle}>{t.errorTitle}</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setError("");
              void carregarClima();
            }}
          >
            <Text style={styles.retryText}>{t.retry}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const primeiroDia = dias[0];
  const recomendacoes = primeiroDia ? getRecommendations(primeiroDia, t) : [];
  const descricaoCondicao = (dia: DiaClima) =>
    getWeatherDescription(dia.codigo, t);

  const hoje = new Date();
  const hojeString = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {renderHeader()}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <View style={styles.destinationCard}>
          <View style={styles.destinationTop}>
            <View style={styles.destinationIcon}>
              <Ionicons name="location" size={22} color={colors.accent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.destinationLabel}>
                {t.currentDestination}
              </Text>
              <Text style={styles.destinationName}>
                {localizacao?.name || viagem?.destino}
              </Text>

              {!!localizacao?.country && (
                <Text style={styles.destinationCountry}>
                  {[localizacao.admin1, localizacao.country]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              )}
            </View>
          </View>

          {periodo && (
            <View style={styles.periodRow}>
              <Ionicons
                name="calendar-outline"
                size={17}
                color={colors.accent}
              />
              <Text style={styles.periodText}>
                {t.tripPeriod}: {formatDate(periodo.inicio, localeDate)} —{" "}
                {formatDate(periodo.fim, localeDate)}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t.forecastTitle}</Text>

        {weatherLoading && (
          <View style={{ paddingVertical: 18, alignItems: "center" }}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>{t.loadingWeather}</Text>
          </View>
        )}

        {!weatherLoading && dias.length === 0 && (
          <View style={styles.unavailableCard}>
            <Ionicons
              name="time-outline"
              size={23}
              color={colors.warning}
              style={{ marginRight: 12, marginTop: 1 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.unavailableTitle}>{t.noForecast}</Text>
              <Text style={styles.unavailableText}>
                {t.noForecastDescription}
              </Text>
            </View>
          </View>
        )}

        {dias.map((dia) => {
          const isToday = dia.data === hojeString;
          const isTomorrow = dia.data === addDays(hojeString, 1);
          const dayLabel = isToday
            ? t.today
            : isTomorrow
              ? t.tomorrow
              : formatDate(dia.data, localeDate);

          return (
            <View key={dia.data} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayName}>{dayLabel}</Text>
                  <Text style={styles.dayCondition}>
                    {descricaoCondicao(dia)}
                  </Text>
                </View>

                <View style={styles.weatherMain}>
                  <View style={styles.weatherIconContainer}>
                    <Ionicons
                      name={getWeatherIcon(dia.codigo)}
                      size={31}
                      color={colors.accent}
                    />
                  </View>
                  <View>
                    <Text style={styles.temperatureRange}>
                      {Math.round(dia.temperaturaMaxima)}° /{" "}
                      {Math.round(dia.temperaturaMinima)}°
                    </Text>
                    <Text style={styles.temperatureLabels}>
                      {t.maximum} / {t.minimum}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <Ionicons
                    name="rainy-outline"
                    size={18}
                    color={colors.blue}
                    style={styles.metricIcon}
                  />
                  <Text style={styles.metricValue}>
                    {Math.round(dia.probabilidadeChuva)}
                    {t.percent}
                  </Text>
                  <Text style={styles.metricLabel}>{t.rain}</Text>
                </View>

                <View style={styles.metric}>
                  <Ionicons
                    name="water-outline"
                    size={18}
                    color={colors.blue}
                    style={styles.metricIcon}
                  />
                  <Text style={styles.metricValue}>
                    {dia.precipitacao.toFixed(1)} {t.mm}
                  </Text>
                  <Text style={styles.metricLabel}>{t.precipitation}</Text>
                </View>

                <View style={styles.metric}>
                  <Ionicons
                    name="navigate-outline"
                    size={18}
                    color={colors.accent}
                    style={styles.metricIcon}
                  />
                  <Text style={styles.metricValue}>
                    {Math.round(dia.vento)} {t.kmh}
                  </Text>
                  <Text style={styles.metricLabel}>{t.wind}</Text>
                </View>

                <View style={styles.metric}>
                  <Ionicons
                    name="water"
                    size={18}
                    color={colors.blue}
                    style={styles.metricIcon}
                  />
                  <Text style={styles.metricValue}>
                    {dia.umidade !== null
                      ? `${Math.round(dia.umidade)}${t.percent}`
                      : "--"}
                  </Text>
                  <Text style={styles.metricLabel}>{t.humidity}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {!weatherLoading && diasIndisponiveis > 0 && (
          <View style={styles.unavailableCard}>
            <Ionicons
              name="calendar-outline"
              size={23}
              color={colors.warning}
              style={{ marginRight: 12, marginTop: 1 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.unavailableTitle}>{t.unavailable}</Text>
              <Text style={styles.unavailableText}>
                {t.noForecastDescription}
              </Text>
            </View>
          </View>
        )}

        {!weatherLoading && primeiroDia && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
              {t.recommendations}
            </Text>

            <View style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <View style={styles.recommendationIcon}>
                  <Ionicons
                    name="briefcase-outline"
                    size={21}
                    color={colors.accent}
                  />
                </View>
                <Text style={styles.recommendationTitle}>
                  {t.weatherConditions}
                </Text>
              </View>

              {primeiroDia.temperaturaMaxima >= 28 && (
                <Text style={styles.notice}>{t.hotWeather}</Text>
              )}
              {primeiroDia.temperaturaMinima <= 12 && (
                <Text style={styles.notice}>{t.coldWeather}</Text>
              )}
              {primeiroDia.probabilidadeChuva >= 50 && (
                <Text style={styles.notice}>{t.rainyWeather}</Text>
              )}
              {primeiroDia.vento >= 30 && (
                <Text style={styles.notice}>{t.windyWeather}</Text>
              )}

              {primeiroDia.temperaturaMaxima < 28 &&
                primeiroDia.temperaturaMinima > 12 &&
                primeiroDia.probabilidadeChuva < 50 &&
                primeiroDia.vento < 30 && (
                  <Text style={styles.notice}>{t.goodWeather}</Text>
                )}

              {recomendacoes.map((item) => (
                <View key={item} style={styles.recommendationItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.accent}
                  />
                  <Text style={styles.recommendationText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.notice}>{t.weatherDisclaimer}</Text>

        <Pressable
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={weatherLoading}
        >
          {weatherLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={19} color="#FFFFFF" />
              <Text style={styles.refreshButtonText}>{t.refresh}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
