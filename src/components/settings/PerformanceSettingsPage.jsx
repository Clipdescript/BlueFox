import React, { useEffect, useRef, useState } from 'react';
import { MdSpeed } from 'react-icons/md';
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
const formatDay = (date) => new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).replace('.', '');

const Sparkline = ({ values, color = '#137b8b' }) => {
  const cleanValues = values.filter((value) => Number.isFinite(value));
  if (cleanValues.length < 2) return <div className="bluefox-performance-empty-chart">Collecte en cours…</div>;
  const max = Math.max(...cleanValues, 1);
  const min = Math.min(...cleanValues, 0);
  const range = Math.max(max - min, 1);
  const points = cleanValues.map((value, index) => `${(index / (cleanValues.length - 1)) * 100},${30 - ((value - min) / range) * 26}`).join(' ');
  return <svg className="bluefox-performance-sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};
const MetricCard = ({ label, value, note, values, color }) => <div className="bluefox-performance-metric"><div className="bluefox-performance-metric-top"><span>{label}</span><strong>{value}</strong></div><small>{note}</small><Sparkline values={values} color={color} /></div>;
const ChartBlock = ({ title, values, suffix, color }) => <div className="bluefox-performance-chart-block"><div><strong>{title}</strong><small>{values.length ? `${Math.round(values.at(-1))}${suffix}` : 'Collecte…'}</small></div><Sparkline values={values} color={color} /></div>;

const PerformanceDashboard = () => {
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
  const memoryText = metrics.appMemoryMb === null ? 'Indisponible' : `${metrics.appMemoryMb} MB`;
  const cpuText = metrics.cpuPercent === null ? 'Indisponible' : `${metrics.cpuPercent.toFixed(1)} %`;
  const systemMemoryText = metrics.systemMemoryUsedPercent === null ? 'Indisponible' : `${Math.round(metrics.systemMemoryUsedPercent)} %`;
  const connection = navigator.connection?.effectiveType || 'réseau actif';

  return <SectionShell icon={MdSpeed} title="Performances" description="BlueFox privilégie un démarrage rapide.">
    <div className="bluefox-performance-dashboard">
      <div className="bluefox-performance-cards"><MetricCard label="RAM BlueFox" value={memoryText} note={`${metrics.processCount || 0} processus Chromium`} values={memoryValues} color="#1a73e8" /><MetricCard label="CPU BlueFox" value={cpuText} note={`${metrics.cpuCores || '—'} cœurs disponibles`} values={cpuValues} color="#8b5cf6" /><MetricCard label="RAM système" value={systemMemoryText} note="Mémoire Windows utilisée" values={systemMemoryValues} color="#e67e22" /><MetricCard label="Ping réseau" value={averagePing === null ? '—' : `${averagePing} ms`} note={connection} values={days.at(-1)?.[1]?.ping || []} color="#137b8b" /></div>
      <div className="bluefox-performance-panel"><div className="bluefox-performance-panel-heading"><div><h3>Évolution en temps réel</h3><p>Mesures locales actualisées toutes les 2 secondes, ping vérifié toutes les 15 secondes.</p></div><span className="bluefox-performance-live"><i /> En direct</span></div><div className="bluefox-performance-chart-grid"><ChartBlock title="RAM BlueFox" values={memoryValues} suffix=" %" color="#1a73e8" /><ChartBlock title="CPU BlueFox" values={cpuValues} suffix=" %" color="#8b5cf6" /><ChartBlock title="RAM système" values={systemMemoryValues} suffix=" %" color="#e67e22" /><ChartBlock title="Ping" values={days.at(-1)?.[1]?.ping || []} suffix=" ms" color="#137b8b" /></div></div>
      <div className="bluefox-performance-panel"><div className="bluefox-performance-panel-heading"><div><h3>Détail par processus</h3><p>Les processus qui utilisent le plus de mémoire apparaissent en premier.</p></div><span className="bluefox-performance-process-count">{metrics.processes?.length || 0} processus</span></div><div className="bluefox-performance-process-list">{metrics.processes?.length ? metrics.processes.map((process) => <div className="bluefox-performance-process" key={`${process.pid}-${process.type}`}><div className="bluefox-performance-process-name"><strong>{process.name}</strong><small>{process.type} · PID {process.pid}</small></div><span>{process.memoryMb} MB</span><span>{process.cpuPercent.toFixed(1)} % CPU</span></div>) : <div className="bluefox-performance-empty-chart">Collecte des processus en cours…</div>}</div></div>
      <div className="bluefox-performance-panel"><div className="bluefox-performance-panel-heading"><div><h3>Historique des 7 derniers jours</h3><p>Moyennes enregistrées localement sur cet appareil.</p></div></div><div className="bluefox-performance-history">{days.length ? days.map(([day, values]) => { const pings = values.ping || []; const avg = pings.length ? Math.round(pings.reduce((sum, value) => sum + value, 0) / pings.length) : null; const memory = values.memory?.length ? Math.round(values.memory.reduce((sum, value) => sum + value, 0) / values.memory.length) : null; return <div className="bluefox-performance-day" key={day}><strong>{formatDay(new Date(`${day}T12:00:00`))}</strong><span>{day.slice(5).replace('-', '/')}</span><div className="bluefox-performance-day-bars"><i style={{ height: `${Math.max(8, memory || 8)}%` }} title={`Mémoire : ${memory ?? '—'} %`} /><i style={{ height: `${Math.max(8, Math.min(100, avg ? avg / 3 : 8))}%` }} title={`Ping : ${avg ?? '—'} ms`} /></div><small>{avg === null ? 'Pas de ping' : `${avg} ms`}</small></div>; }) : <div className="bluefox-performance-empty-chart">L’historique se remplira au fil de l’utilisation.</div>}</div></div>
      <p className="bluefox-performance-footnote">Les mesures restent locales. RAM et CPU proviennent des processus Electron/Chromium, la RAM système vient de Windows et le ping mesure le temps aller-retour vers un point de contrôle réseau.</p>
    </div>
  </SectionShell>;
};

export default PerformanceDashboard;
