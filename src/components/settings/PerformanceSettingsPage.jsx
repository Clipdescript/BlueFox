import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSpeed } from 'react-icons/md';
import './PerformanceSettingsPage.css';
import { SectionShell } from './SettingsPrimitives.jsx';

const PERFORMANCE_HISTORY_KEY = 'bluefox_performance_history_v1';
const readPerformanceHistory = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(PERFORMANCE_HISTORY_KEY) || '{}');
    return stored && typeof stored === 'object' ? stored : {};
  } catch {
    return {};
  }
};
const clampMetric = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const formatDay = (date, language = 'fr') => new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'fr-FR', { weekday: 'short' }).format(date).replace('.', '');

const Sparkline = ({ values, color = '#137b8b', emptyLabel = 'Collecte en cours…' }) => {
  const cleanValues = values.filter((value) => Number.isFinite(value));
  if (cleanValues.length < 2) return <div className="bluefox-performance-empty-chart">{emptyLabel}</div>;
  const max = Math.max(...cleanValues, 1);
  const min = Math.min(...cleanValues, 0);
  const range = Math.max(max - min, 1);
  const points = cleanValues.map((value, index) => `${(index / (cleanValues.length - 1)) * 100},${30 - ((value - min) / range) * 26}`).join(' ');
  return <svg className="bluefox-performance-sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};
const MetricCard = ({ label, value, note, values, color }) => <div className="bluefox-performance-metric"><div className="bluefox-performance-metric-top"><span>{label}</span><strong>{value}</strong></div><small>{note}</small><Sparkline values={values} color={color} /></div>;
const ChartBlock = ({ title, values, suffix, color }) => <div className="bluefox-performance-chart-block"><div><strong>{title}</strong><small>{values.length ? `${Math.round(values.at(-1))}${suffix}` : 'Collecte…'}</small></div><Sparkline values={values} color={color} /></div>;

const PerformanceDashboard = () => {
  const { t, i18n } = useTranslation('common');
  const selectedLanguage = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'fr';
  const [metrics, setMetrics] = useState({ appMemoryMb: null, appMemoryPercent: null, systemMemoryUsedPercent: null, cpuPercent: null, processCount: 0, cpuCores: 0, processes: [] });
  const [systemSamples, setSystemSamples] = useState([]);
  const [history, setHistory] = useState(readPerformanceHistory);
  const sampleCount = useRef(0);

  useEffect(() => {
    const collect = () => {
      const memory = performance.memory?.usedJSHeapSize && performance.memory?.jsHeapSizeLimit ? clampMetric((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100) : null;
      sampleCount.current += 1;
      if (sampleCount.current % 5 === 0) {
        const day = new Date().toISOString().slice(0, 10);
        setHistory((currentHistory) => {
          const currentDay = currentHistory[day] || { memory: [], responsiveness: [], ping: [] };
          const nextHistory = { ...currentHistory, [day]: { ...currentDay, memory: [...currentDay.memory, memory].filter(Number.isFinite).slice(-720) } };
          const trimmed = Object.fromEntries(Object.entries(nextHistory).sort(([first], [second]) => first.localeCompare(second)).slice(-7));
          localStorage.setItem(PERFORMANCE_HISTORY_KEY, JSON.stringify(trimmed));
          return trimmed;
        });
      }
    };
    collect();
    const interval = window.setInterval(collect, 2000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const measurePing = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      const started = performance.now();
      try {
        await fetch(`https://www.google.com/generate_204?bluefox_ping=${Date.now()}`, { cache: 'no-store', mode: 'no-cors', signal: controller.signal });
        const ping = Math.round(performance.now() - started);
        if (cancelled) return;
        const day = new Date().toISOString().slice(0, 10);
        setHistory((currentHistory) => {
          const currentDay = currentHistory[day] || { memory: [], responsiveness: [], ping: [] };
          const nextHistory = { ...currentHistory, [day]: { ...currentDay, ping: [...(currentDay.ping || []), ping].slice(-720) } };
          const trimmed = Object.fromEntries(Object.entries(nextHistory).sort(([first], [second]) => first.localeCompare(second)).slice(-7));
          localStorage.setItem(PERFORMANCE_HISTORY_KEY, JSON.stringify(trimmed));
          return trimmed;
        });
        setMetrics((current) => ({ ...current, ping }));
      } catch {
        if (!cancelled) setMetrics((current) => ({ ...current, ping: null }));
      } finally { window.clearTimeout(timeout); }
    };
    measurePing();
    const interval = window.setInterval(measurePing, 15000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const collectSystemMetrics = async () => {
      try {
        const nextMetrics = await window.electron?.getPerformanceMetrics?.();
        if (!nextMetrics || cancelled) return;
        setMetrics((current) => ({ ...current, ...nextMetrics, ping: nextMetrics.pingMs ?? current.ping }));
        setSystemSamples((current) => [...current, { appMemoryPercent: nextMetrics.appMemoryPercent, systemMemoryUsedPercent: nextMetrics.systemMemoryUsedPercent, cpuPercent: nextMetrics.cpuPercent }].slice(-30));
      } catch { /* fallback renderer */ }
    };
    collectSystemMetrics();
    const interval = window.setInterval(collectSystemMetrics, 5000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  const memoryValues = systemSamples.map((sample) => sample.appMemoryPercent).filter(Number.isFinite);
  const cpuValues = systemSamples.map((sample) => sample.cpuPercent).filter(Number.isFinite);
  const systemMemoryValues = systemSamples.map((sample) => sample.systemMemoryUsedPercent).filter(Number.isFinite);
  const days = Object.entries(history).slice(-7);
  const averagePing = metrics.ping ?? (days.at(-1)?.[1]?.ping?.length ? Math.round(days.at(-1)[1].ping.reduce((sum, value) => sum + value, 0) / days.at(-1)[1].ping.length) : null);
  const memoryText = metrics.appMemoryMb === null ? t('settingsExtra.unavailableMetric') : `${metrics.appMemoryMb} MB`;
  const cpuText = metrics.cpuPercent === null ? t('settingsExtra.unavailableMetric') : `${metrics.cpuPercent.toFixed(1)} %`;
  const systemMemoryText = metrics.systemMemoryUsedPercent === null ? t('settingsExtra.unavailableMetric') : `${Math.round(metrics.systemMemoryUsedPercent)} %`;
  const connection = navigator.connection?.effectiveType || t('settingsExtra.networkPing');

  return <SectionShell icon={MdSpeed} title={t('settings.nav.performance')} description={t('settingsExtra.performanceDescription')}>
    <div className="bluefox-performance-dashboard">
      <div className="bluefox-performance-cards"><MetricCard label={t('settingsExtra.memoryBluefox')} value={memoryText} note={`${metrics.processCount || 0} ${t('settingsExtra.processes', { count: metrics.processCount || 0 }).replace(String(metrics.processCount || 0), '').trim()}`} values={memoryValues} color="#1a73e8" /><MetricCard label={t('settingsExtra.cpuBluefox')} value={cpuText} note={t('settingsExtra.cores', { count: metrics.cpuCores || 0 })} values={cpuValues} color="#8b5cf6" /><MetricCard label={t('settingsExtra.systemMemory')} value={systemMemoryText} note={t('settingsExtra.memoryWindows')} values={systemMemoryValues} color="#e67e22" /><MetricCard label={t('settingsExtra.networkPing')} value={averagePing === null ? '—' : `${averagePing} ms`} note={connection} values={days.at(-1)?.[1]?.ping || []} color="#137b8b" /></div>
      <div className="bluefox-performance-panel"><div className="bluefox-performance-panel-heading"><div><h3>{t('settingsExtra.realtime')}</h3><p>{t('settingsExtra.realtimeText')}</p></div><span className="bluefox-performance-live"><i /> {t('settingsExtra.live')}</span></div><div className="bluefox-performance-chart-grid"><ChartBlock title={t('settingsExtra.memoryBluefox')} values={memoryValues} suffix=" %" color="#1a73e8" /><ChartBlock title={t('settingsExtra.cpuBluefox')} values={cpuValues} suffix=" %" color="#8b5cf6" /><ChartBlock title={t('settingsExtra.systemMemory')} values={systemMemoryValues} suffix=" %" color="#e67e22" /><ChartBlock title="Ping" values={days.at(-1)?.[1]?.ping || []} suffix=" ms" color="#137b8b" /></div></div>
      <div className="bluefox-performance-panel"><div className="bluefox-performance-panel-heading"><div><h3>{t('settingsExtra.processDetail')}</h3><p>{t('settingsExtra.processDetailText')}</p></div><span className="bluefox-performance-process-count">{t('settingsExtra.processes', { count: metrics.processes?.length || 0 })}</span></div><div className="bluefox-performance-process-list">{metrics.processes?.length ? metrics.processes.map((process) => <div className="bluefox-performance-process" key={`${process.pid}-${process.type}`}><div className="bluefox-performance-process-name"><strong>{process.name}</strong><small>{process.type} · PID {process.pid}</small></div><span>{process.memoryMb} MB</span><span>{process.cpuPercent.toFixed(1)} % CPU</span></div>) : <div className="bluefox-performance-empty-chart">{t('settingsExtra.collecting')}</div>}</div></div>
      <div className="bluefox-performance-panel"><div className="bluefox-performance-panel-heading"><div><h3>{t('settingsExtra.lastSevenDays')}</h3><p>{t('settingsExtra.lastSevenText')}</p></div></div><div className="bluefox-performance-history">{days.length ? days.map(([day, values]) => { const pings = values.ping || []; const avg = pings.length ? Math.round(pings.reduce((sum, value) => sum + value, 0) / pings.length) : null; const memory = values.memory?.length ? Math.round(values.memory.reduce((sum, value) => sum + value, 0) / values.memory.length) : null; return <div className="bluefox-performance-day" key={day}><strong>{formatDay(new Date(`${day}T12:00:00`), selectedLanguage)}</strong><span>{day.slice(5).replace('-', '/')}</span><div className="bluefox-performance-day-bars"><i style={{ height: `${Math.max(8, memory || 8)}%` }} title={`Mémoire : ${memory ?? '—'} %`} /><i style={{ height: `${Math.max(8, Math.min(100, avg ? avg / 3 : 8))}%` }} title={`Ping : ${avg ?? '—'} ms`} /></div><small>{avg === null ? 'Pas de ping' : `${avg} ms`}</small></div>; }) : <div className="bluefox-performance-empty-chart">{t('settingsExtra.lastSevenText')}</div>}</div></div>
      <p className="bluefox-performance-footnote">{t('settingsExtra.localMeasures')}</p>
    </div>
  </SectionShell>;
};

export default PerformanceDashboard;
