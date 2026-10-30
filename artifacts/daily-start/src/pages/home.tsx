import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getGetHomeNewsQueryKey, getGetHomeWeatherQueryKey, useGetHomeNews, useGetHomeWeather } from '@workspace/api-client-react';
import { Cloud, CloudSun, Grip, Mic, Search, Sun, Wind, X } from 'lucide-react';

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const SEOUL = { latitude: 37.5665, longitude: 126.978 };

function greetingFor(hour: number) {
  if (hour < 5) return '깊은 밤이네요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '편안한 저녁이에요';
}

function dateLabel(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: timezone,
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
}

function relativeTime(dateValue: string | null) {
  if (!dateValue) return '최근';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000));
  if (seconds < 60) return '방금 전';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  return `${Math.floor(seconds / 86400)}일 전`;
}

function GoogleMark() {
  return (
    <div className="wordmark" aria-label="Google">
      <span className="google-blue">G</span><span className="google-red">o</span><span className="google-yellow">o</span><span className="google-blue">g</span><span className="google-green">l</span><span className="google-red">e</span>
    </div>
  );
}

export default function Home() {
  const [coords, setCoords] = useState(SEOUL);
  const [clock, setClock] = useState(() => new Date());
  const [query, setQuery] = useState('');
  const [appsOpen, setAppsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const weatherParams = useMemo(() => ({ latitude: coords.latitude, longitude: coords.longitude }), [coords.latitude, coords.longitude]);
  const weather = useGetHomeWeather(weatherParams, {
    query: { queryKey: getGetHomeWeatherQueryKey(weatherParams), enabled: Number.isFinite(weatherParams.latitude) && Number.isFinite(weatherParams.longitude), refetchInterval: 10 * 60 * 1000 },
  });
  const news = useGetHomeNews({
    query: { queryKey: getGetHomeNewsQueryKey(), refetchInterval: 5 * 60 * 1000 },
  });

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => setCoords(SEOUL),
      { timeout: 7000, maximumAge: 15 * 60 * 1000 },
    );
  }, []);

  const timezone = weather.data?.timezone || 'Asia/Seoul';
  const localHour = Number(new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(clock));
  const searchUrl = (term: string) => `https://www.google.com/search?q=${encodeURIComponent(term)}`;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    window.location.assign(searchUrl(query.trim()));
  }

  function luckySearch() {
    if (!query.trim()) {
      document.getElementById('search-input')?.focus();
      return;
    }
    window.location.assign(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}&btnI=I`);
  }

  function startVoiceSearch() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceMessage('이 브라우저에서는 음성 검색을 사용할 수 없어요.');
      window.setTimeout(() => setVoiceMessage(''), 3500);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const spoken = event.results[0]?.[0]?.transcript;
      if (spoken) {
        setQuery(spoken);
        window.location.assign(searchUrl(spoken));
      }
    };
    recognition.onerror = () => {
      setListening(false);
      setVoiceMessage('음성을 듣지 못했어요. 다시 시도해 주세요.');
      window.setTimeout(() => setVoiceMessage(''), 3500);
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    setVoiceMessage('듣고 있어요…');
    recognition.start();
  }

  const weatherIcon = weather.data?.weatherCode === 0 ? <Sun size={22} /> : <CloudSun size={23} />;

  return (
    <main className="start-page">
      <header className="topbar">
        <nav className="top-links" aria-label="Google 서비스">
          <a href="https://mail.google.com" data-testid="link-gmail">Gmail</a>
          <a href="https://images.google.com" data-testid="link-images">이미지</a>
          <div className="apps-wrap">
            <button className="apps-button" type="button" aria-label="Google 앱 메뉴" aria-expanded={appsOpen} onClick={() => setAppsOpen((open) => !open)} data-testid="button-apps">
              <Grip size={21} strokeWidth={2.1} />
            </button>
            {appsOpen && (
              <div className="apps-popover" role="menu">
                <a href="https://mail.google.com" role="menuitem">Gmail</a>
                <a href="https://images.google.com" role="menuitem">이미지</a>
                <a href="https://maps.google.com" role="menuitem">지도</a>
                <a href="https://drive.google.com" role="menuitem">드라이브</a>
              </div>
            )}
          </div>
        </nav>
      </header>

      <section className="hero" aria-label="Google 검색">
        <div className="time-context">
          <div className="clock" data-testid="text-current-time" aria-live="off">
            {new Intl.DateTimeFormat('ko-KR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(clock)}
          </div>
          <div className="date-greeting">
            <span>{dateLabel(clock, timezone)}</span>
            <span className="date-divider" aria-hidden="true">·</span>
            <span>{greetingFor(localHour)}</span>
          </div>
        </div>
        <GoogleMark />
        <form className="search-form" onSubmit={submitSearch} role="search">
          <div className="search-box">
            <Search className="search-symbol" size={20} aria-hidden="true" />
            <input id="search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Google 검색" aria-label="Google 검색" autoComplete="off" data-testid="input-search" />
            {query && <button className="clear-query" type="button" aria-label="검색어 지우기" onClick={() => setQuery('')} data-testid="button-clear-search"><X size={18} /></button>}
            <span className="search-separator" aria-hidden="true" />
            <button className={`voice-button${listening ? ' is-listening' : ''}`} type="button" aria-label="음성으로 검색" onClick={startVoiceSearch} data-testid="button-voice-search"><Mic size={20} /></button>
          </div>
          <div className="search-actions">
            <button type="submit" className="search-action" data-testid="button-google-search">Google 검색</button>
            <button type="button" className="search-action" onClick={luckySearch} data-testid="button-lucky-search">I'm Feeling Lucky</button>
          </div>
          {voiceMessage && <p className="voice-status" role="status">{voiceMessage}</p>}
        </form>

        <div className="weather-strip" data-testid="weather-snapshot">
          {weather.isLoading ? (
            <div className="weather-loading" aria-label="날씨를 불러오는 중"><span /><span /><span /></div>
          ) : weather.isError ? (
            <div className="weather-error">
              <span>날씨 정보를 불러오지 못했어요</span>
              <button type="button" onClick={() => weather.refetch()} data-testid="button-weather-retry">다시 시도</button>
            </div>
          ) : weather.data ? (
            <>
              <span className="weather-icon" aria-hidden="true">{weatherIcon}</span>
              <span className="weather-temp">{Math.round(weather.data.temperatureC)}°</span>
              <span className="weather-description">{weather.data.description}</span>
              <span className="weather-divider" aria-hidden="true" />
              <span className="weather-detail">체감 {Math.round(weather.data.apparentTemperatureC)}°</span>
              <span className="weather-detail weather-humidity">습도 {weather.data.humidityPercent}%</span>
              <span className="weather-detail weather-wind"><Wind size={14} /> {weather.data.windSpeedKmh} km/h</span>
              <span className="weather-place">현재 위치</span>
            </>
          ) : <span className="weather-detail">서울의 오늘 날씨</span>}
        </div>
      </section>

      <section className="news-section" aria-labelledby="news-heading">
        <div className="news-heading-row">
          <div>
            <p className="eyebrow">오늘의 테크 브리핑</p>
            <h1 id="news-heading">지금 주목할 기술 뉴스</h1>
          </div>
          <span className="live-label"><span className="live-dot" /> 실시간 업데이트</span>
        </div>
        {news.isLoading ? (
          <div className="news-skeletons" aria-label="뉴스를 불러오는 중">
            {[0, 1, 2].map((item) => <div className="news-skeleton" key={item}><span /><span /><span /></div>)}
          </div>
        ) : news.isError ? (
          <div className="news-error">
            <p>뉴스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
            <button type="button" onClick={() => news.refetch()} data-testid="button-news-retry">다시 불러오기</button>
          </div>
        ) : news.data?.length ? (
          <ol className="headline-list">
            {news.data.slice(0, 5).map((headline, index) => (
              <li key={`${headline.title}-${index}`}>
                <a className="headline-link" href={searchUrl(headline.title)} target="_blank" rel="noreferrer" data-testid={`link-headline-${index}`}>
                  <span className="headline-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="headline-copy">
                    <span className="headline-title">{headline.title}</span>
                    <span className="headline-meta"><span>{headline.publisher}</span><span className="meta-dot">·</span><span>{relativeTime(headline.publishedAt)}</span></span>
                  </span>
                  <span className="headline-arrow" aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <div className="news-empty">
            <Cloud size={20} />
            <p>새로운 기술 소식이 아직 도착하지 않았어요.</p>
          </div>
        )}
      </section>
      <footer className="page-footer">
        <span>검색으로 오늘을 시작해요</span>
        <a href="https://www.google.com" aria-label="Google 홈페이지">Google</a>
      </footer>
    </main>
  );
}
