import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUpModule from 'react-countup';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import * as Popover from '@radix-ui/react-popover';

import { Icon } from '@/shared/components/Icon';
import { MoneyText } from '@/shared/value/money/MoneyText';

import styles from './DebtDistributionBar.module.css';

const CountUp =
  (CountUpModule as { default?: typeof CountUpModule }).default ||
  CountUpModule;

export type DebtSegment = {
  key: string;
  label: string;
  value: number;
  color: 'success' | 'warning' | 'danger' | 'primary';
  clickable?: boolean;
};

export type DebtDistributionBarProps = {
  total: number;
  segments: DebtSegment[];
  animated?: boolean;
  realtime?: boolean;
  showLegend?: boolean;
  showTarget?: number; // Target percentage (e.g. 20%)
  showTrend?: boolean;
  aiInsight?: React.ReactNode | string;
  onSegmentClick?: (segment: DebtSegment) => void;
};

const getGradientClass = (color: string) => {
  switch (color) {
    case 'success':
      return styles.gradientSuccess;
    case 'warning':
      return styles.gradientWarning;
    case 'danger':
      return styles.gradientDanger;
    case 'primary':
      return styles.gradientPrimary;
    default:
      return styles.gradientPrimary;
  }
};

function calculateVisibleTotal(segments: DebtSegment[]): number {
  let total = 0;
  for (const s of segments) {
    total += s.value;
  }
  return total;
}

function findLargestSegmentKey(segments: DebtSegment[]): string | null {
  let largest: DebtSegment | null = null;
  for (const s of segments) {
    if (!largest || s.value > largest.value) {
      largest = s;
    }
  }
  return largest ? largest.key : null;
}

export function DebtDistributionBar({
  total,
  segments,
  animated = true,
  showLegend = true,
  showTarget,
  showTrend,
  aiInsight,
  onSegmentClick,
}: DebtDistributionBarProps) {
  const [hiddenSegments, setHiddenSegments] = useState<Set<string>>(new Set());

  const toggleSegment = (key: string) => {
    const newHidden = new Set(hiddenSegments);
    if (newHidden.has(key)) {
      newHidden.delete(key);
    } else {
      newHidden.add(key);
    }
    setHiddenSegments(newHidden);
  };

  const visibleSegments = useMemo(() => {
    return segments.filter((s) => !hiddenSegments.has(s.key));
  }, [segments, hiddenSegments]);

  const visibleTotal = useMemo(() => {
    return calculateVisibleTotal(visibleSegments);
  }, [visibleSegments]);

  // Find the largest segment for highlight
  const largestSegmentKey = useMemo(() => {
    return findLargestSegmentKey(visibleSegments);
  }, [visibleSegments]);

  // Sparkline mock data
  const trendData = [
    { value: 90 },
    { value: 88 },
    { value: 85 },
    { value: 86 },
    { value: 84 },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Total Amount Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
            Tổng nợ hiện tại
          </p>
          <div className="text-2xl font-bold text-foreground">
            {animated ? (
              <>
                <CountUp
                  end={total}
                  separator="."
                  duration={2}
                  preserveValue={true}
                />
                <span className="text-sm text-muted ml-1 font-normal">đ</span>
              </>
            ) : (
              <MoneyText value={total} />
            )}
          </div>
        </div>

        {showTrend && (
          <div className="flex flex-col items-end gap-1">
            <div className="h-8 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--danger)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[10px] text-muted flex items-center gap-1">
              <Icon name="TrendingDown" className="w-3 h-3 text-success" /> Giảm
              6% (30 ngày)
            </span>
          </div>
        )}
      </div>

      {/* Main Bar */}
      <div className="relative pt-2">
        {showTarget && (
          <div
            className="absolute top-0 bottom-0 w-px bg-foreground/20 z-10"
            style={{ left: `${showTarget}%` }}
          >
            <div className="absolute -top-5 -translate-x-1/2 text-[10px] font-bold text-muted flex flex-col items-center">
              <span>Target</span>
              <span>▼</span>
            </div>
          </div>
        )}

        <div className={styles.barContainer}>
          <AnimatePresence>
            {visibleSegments.map((segment) => {
              const percent =
                visibleTotal > 0 ? (segment.value / visibleTotal) * 100 : 0;
              const isLargest = segment.key === largestSegmentKey;

              return (
                <Popover.Root key={segment.key}>
                  <Popover.Trigger asChild>
                    <motion.div
                      layout
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: `${percent}%`, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{
                        duration: 0.5,
                        type: 'spring',
                        bounce: 0.2,
                      }}
                      className={`
                        ${styles.segment} 
                        ${getGradientClass(segment.color)} 
                        ${isLargest ? styles.glassHighlight : ''}
                        ${segment.clickable ? styles.clickable : ''}
                      `}
                      onClick={() => onSegmentClick?.(segment)}
                    >
                      <div className={styles.patternOverlay} />
                      {percent >= 8 && (
                        <span className="relative z-10 drop-shadow-md">
                          {animated ? (
                            <CountUp
                              end={percent}
                              duration={1}
                              decimals={1}
                              suffix="%"
                            />
                          ) : (
                            `${percent.toFixed(1)}%`
                          )}
                        </span>
                      )}
                    </motion.div>
                  </Popover.Trigger>

                  <Popover.Portal>
                    <Popover.Content className="z-50 w-64 rounded-md border border-border bg-surface p-4 shadow-lg animate-in fade-in zoom-in duration-200">
                      <div className="flex flex-col gap-2">
                        <div className="font-bold">{segment.label}</div>
                        <div
                          className="text-xl font-bold"
                          style={{ color: `var(--${segment.color})` }}
                        >
                          <MoneyText value={segment.value} />
                        </div>
                        <div className="text-xs text-muted">
                          Chiếm {percent.toFixed(1)}% tổng số
                        </div>
                        {segment.clickable && (
                          <button
                            className="mt-2 w-full py-1.5 px-3 bg-surface-secondary hover:bg-surface-secondary/80 text-sm rounded transition-colors"
                            onClick={() => onSegmentClick?.(segment)}
                          >
                            Xem chi tiết
                          </button>
                        )}
                      </div>
                      <Popover.Arrow className="fill-surface" />
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex gap-4 items-center flex-wrap mt-1">
          {segments.map((segment) => {
            const isHidden = hiddenSegments.has(segment.key);
            return (
              <label
                key={segment.key}
                className={`flex items-center gap-1.5 text-xs cursor-pointer transition-opacity ${isHidden ? 'opacity-40' : 'opacity-100 hover:opacity-80'}`}
              >
                <input
                  type="checkbox"
                  checked={!isHidden}
                  onChange={() => toggleSegment(segment.key)}
                  className="hidden"
                />
                <div
                  className={`w-3 h-3 rounded-full ${getGradientClass(segment.color)}`}
                />
                <span>{segment.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* AI Insight */}
      {aiInsight && (
        <div className="mt-2 p-3 bg-primary/5 border border-primary/10 rounded-lg flex gap-3 items-start">
          <div className="mt-0.5 text-primary">
            <Icon name="AlertCircle" className="w-4 h-4" />
          </div>
          <div className="text-sm text-foreground/90 leading-relaxed">
            {aiInsight}
          </div>
        </div>
      )}
    </div>
  );
}
