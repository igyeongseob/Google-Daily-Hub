import { Router, type IRouter } from "express";
import {
  GetHomeNewsResponse,
  GetHomeWeatherQueryParams,
  GetHomeWeatherResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "맑음",
  1: "대체로 맑음",
  2: "구름 조금",
  3: "흐림",
  45: "안개",
  48: "짙은 안개",
  51: "이슬비",
  53: "약한 이슬비",
  55: "강한 이슬비",
  56: "어는 이슬비",
  57: "강한 어는 이슬비",
  61: "약한 비",
  63: "비",
  65: "강한 비",
  66: "어는 비",
  67: "강한 어는 비",
  71: "약한 눈",
  73: "눈",
  75: "강한 눈",
  77: "싸락눈",
  80: "소나기",
  81: "강한 소나기",
  82: "매우 강한 소나기",
  85: "눈 소나기",
  86: "강한 눈 소나기",
  95: "뇌우",
  96: "우박을 동반한 뇌우",
  99: "강한 우박을 동반한 뇌우",
};

function asFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Weather provider returned an invalid ${field}`);
  }
  return value;
}

router.get("/home/weather", async (req, res): Promise<void> => {
  const params = GetHomeWeatherQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const upstreamUrl = new URL("https://api.open-meteo.com/v1/forecast");
  upstreamUrl.search = new URLSearchParams({
    latitude: String(params.data.latitude),
    longitude: String(params.data.longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    timezone: "auto",
  }).toString();

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      req.log.warn(
        { status: upstream.status },
        "Weather provider returned an error",
      );
      res.status(502).json({ error: "Weather data is temporarily unavailable" });
      return;
    }

    const providerData = (await upstream.json()) as {
      current?: Record<string, unknown>;
      timezone?: unknown;
    };
    const current = providerData.current;
    if (!current || typeof providerData.timezone !== "string") {
      throw new Error("Weather provider returned an incomplete response");
    }
    const weatherCode = asFiniteNumber(current.weather_code, "weather code");
    const result = GetHomeWeatherResponse.parse({
      temperatureC: asFiniteNumber(current.temperature_2m, "temperature"),
      apparentTemperatureC: asFiniteNumber(
        current.apparent_temperature,
        "apparent temperature",
      ),
      humidityPercent: asFiniteNumber(
        current.relative_humidity_2m,
        "humidity",
      ),
      windSpeedKmh: asFiniteNumber(current.wind_speed_10m, "wind speed"),
      weatherCode,
      description: WEATHER_DESCRIPTIONS[weatherCode] ?? "날씨 정보",
      timezone: providerData.timezone,
      observedAt:
        typeof current.time === "string" ? current.time : new Date().toISOString(),
    });
    res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "Unable to retrieve current weather");
    res.status(502).json({ error: "Weather data is temporarily unavailable" });
  }
});

function decodeXml(value: string): string {
  const withoutCdata = value.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1");
  return withoutCdata
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function readXmlTag(source: string, tag: string): string {
  const match = source.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}\\s*>`, "i"),
  );
  return match ? decodeXml(match[1]) : "";
}

function parsePublisher(title: string): { title: string; publisher: string } {
  const separator = title.lastIndexOf(" - ");
  if (separator < 0) return { title, publisher: "Google 뉴스" };
  return {
    title: title.slice(0, separator).trim(),
    publisher: title.slice(separator + 3).trim() || "Google 뉴스",
  };
}

router.get("/home/news", async (req, res): Promise<void> => {
  const upstreamUrl = new URL("https://news.google.com/rss/search");
  upstreamUrl.search = new URLSearchParams({
    q: "(AI OR 반도체 OR 기술 OR 로봇) when:1d",
    hl: "ko",
    gl: "KR",
    ceid: "KR:ko",
  }).toString();

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        "User-Agent": "DailyStart/1.0",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!upstream.ok) {
      req.log.warn(
        { status: upstream.status },
        "News provider returned an error",
      );
      res.status(502).json({ error: "News is temporarily unavailable" });
      return;
    }

    const xml = await upstream.text();
    const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)]
      .map(([, item]) => {
        const rawTitle = readXmlTag(item, "title");
        const link = readXmlTag(item, "link");
        const pubDate = readXmlTag(item, "pubDate");
        const parsedTitle = parsePublisher(rawTitle);
        const published = pubDate ? new Date(pubDate) : null;

        return {
          title: parsedTitle.title,
          publisher: parsedTitle.publisher,
          publishedAt:
            published && Number.isFinite(published.getTime())
              ? published.toISOString()
              : null,
          url: link,
        };
      })
      .filter(
        (item) =>
          item.title.length > 0 &&
          item.url.startsWith("https://") &&
          item.url.length < 2048,
      )
      .slice(0, 8);

    res.json(GetHomeNewsResponse.parse(items));
  } catch (error) {
    req.log.error({ err: error }, "Unable to retrieve technology news");
    res.status(502).json({ error: "News is temporarily unavailable" });
  }
});

export default router;
