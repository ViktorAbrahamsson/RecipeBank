import React, { useState, useEffect, useRef, useCallback, isValidElement, cloneElement } from 'react';
import styles from './TimerButton.module.scss';

const TIME_PATTERN =
  '(\\d+)\\s*h\\s+(\\d+)\\s*min(?:ut(?:er)?)?|' +
  '(\\d+(?:[,.]\\d+)?)\\s*(timm(?:e|ar)|h|min(?:ut(?:er)?)?|sek(?:und(?:er)?)?)\\b';

function parseSeconds(m: RegExpMatchArray): number {
  if (m[1] !== undefined && m[2] !== undefined) {
    return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60;
  }
  if (!m[3] || !m[4]) return 0;
  const value = parseFloat(m[3].replace(',', '.'));
  const unit = m[4].toLowerCase();
  if (unit === 'h' || unit.startsWith('timm')) return Math.round(value * 3600);
  if (unit.startsWith('min')) return Math.round(value * 60);
  if (unit.startsWith('sek')) return Math.round(value);
  return 0;
}

function playDone(): void {
  try {
    const ctx = new AudioContext();
    const partials: [number, number, number][] = [
      [880,  0.28, 2.5],
      [1760, 0.14, 1.5],
      [2637, 0.06, 0.8],
    ];
    partials.forEach(([freq, peak, decay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + decay);
    });
  } catch { /* AudioContext unavailable */ }
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PauseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

export function TimerButton({ seconds, label, paused }: { seconds: number; label: string; paused?: boolean }) {
  const [state, setState] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const startCountdown = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setState('done');
          playDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const start = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRemaining(seconds);
    if (paused) {
      setState('paused');
    } else {
      setState('running');
      startCountdown();
    }
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearInterval(intervalRef.current);
    setState('idle');
    setRemaining(seconds);
  };

  const resume = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState('running');
    startCountdown();
  };

  // Pause when step is checked; resume when unchecked
  useEffect(() => {
    if (paused && state === 'running') {
      clearInterval(intervalRef.current);
      setState('paused');
    } else if (!paused && state === 'paused') {
      setState('running');
      startCountdown();
    }
  // state intentionally omitted — we only want to react to paused changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  if (state === 'running') {
    return (
      <span className={`${styles.timer} ${styles['timer--running']}`}>
        <ClockIcon />
        {formatTime(remaining)}
        <button onClick={reset} title="Avbryt timer" aria-label="Avbryt timer">×</button>
      </span>
    );
  }

  if (state === 'paused') {
    return (
      <span className={`${styles.timer} ${styles['timer--paused']}`}>
        <PauseIcon />
        {formatTime(remaining)}
        <button onClick={resume} title="Fortsätt timer" aria-label="Fortsätt timer">▶</button>
        <button onClick={reset} title="Avbryt timer" aria-label="Avbryt timer">×</button>
      </span>
    );
  }

  if (state === 'done') {
    return (
      <span className={`${styles.timer} ${styles['timer--done']}`}>
        ✓ {label}
        <button onClick={reset} title="Återställ timer" aria-label="Återställ timer">×</button>
      </span>
    );
  }

  return (
    <button className={styles.timer} onClick={start} title={`Starta timer: ${label}`}>
      {label}
      <ClockIcon />
    </button>
  );
}

export function injectTimers(node: React.ReactNode, keyPrefix: string, paused?: boolean): React.ReactNode {
  if (node == null || typeof node === 'boolean' || typeof node === 'number') return node;

  if (typeof node === 'string') {
    return splitWithTimers(node, keyPrefix, paused);
  }

  if (Array.isArray(node)) {
    return node.map((child, i) => injectTimers(child, `${keyPrefix}-${i}`, paused));
  }

  if (isValidElement(node)) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>;
    const kids = el.props.children;
    if (kids == null) return node;
    const newKids = injectTimers(kids, keyPrefix, paused);
    if (newKids === kids) return node;
    return cloneElement(el, {}, ...(Array.isArray(newKids) ? newKids : [newKids]));
  }

  return node;
}

function splitWithTimers(text: string, keyPrefix: string, paused?: boolean): React.ReactNode {
  const re = new RegExp(TIME_PATTERN, 'gi');
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let timerCount = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const secs = parseSeconds(match);
    if (secs >= 5) {
      parts.push(
        <TimerButton key={`${keyPrefix}-t${timerCount++}`} seconds={secs} label={match[0]} paused={paused} />
      );
    } else {
      parts.push(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length === 0) return text;
  if (parts.length === 1 && typeof parts[0] === 'string') return parts[0];
  return parts;
}
