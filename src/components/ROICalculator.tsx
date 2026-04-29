'use client';

import { useState, useMemo } from 'react';

export default function ROICalculator() {
  const [numRepos, setNumRepos] = useState(50);
  const [teamSize, setTeamSize] = useState(3);
  const [hoursPerWeek, setHoursPerWeek] = useState(4);

  const results = useMemo(() => {
    const manualHoursPerYear = teamSize * hoursPerWeek * 52;
    // Metamorph: ~6 min per repo per week (glance at dashboard + filter)
    const metamorphHoursPerYear = Math.round(numRepos * 0.1 * 52 * 10) / 10;
    const savedHours = Math.max(0, manualHoursPerYear - metamorphHoursPerYear);
    const savedDollars = Math.round(savedHours * 150);
    const roi = metamorphHoursPerYear > 0
      ? Math.round((savedHours / metamorphHoursPerYear) * 100)
      : 0;
    return { manualHoursPerYear, metamorphHoursPerYear, savedHours, savedDollars, roi };
  }, [numRepos, teamSize, hoursPerWeek]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Inputs */}
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6 mb-6">
        <SliderField
          label="Repos you monitor"
          value={numRepos}
          min={5} max={500} step={5}
          format={(v) => `${v} repos`}
          onChange={setNumRepos}
        />
        <SliderField
          label="Team members checking GitHub"
          value={teamSize}
          min={1} max={20} step={1}
          format={(v) => `${v} ${v === 1 ? 'person' : 'people'}`}
          onChange={setTeamSize}
        />
        <SliderField
          label="Hours per person per week on manual repo review"
          value={hoursPerWeek}
          min={1} max={20} step={1}
          format={(v) => `${v}h / week`}
          onChange={setHoursPerWeek}
        />
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <ResultCard
          label="Hours spent manually / year"
          value={results.manualHoursPerYear.toLocaleString()}
          unit="hours"
          color="text-red-500 dark:text-red-400"
          bg="bg-red-50 dark:bg-red-950/20"
          border="border-red-200 dark:border-red-800/30"
        />
        <ResultCard
          label="Hours with Metamorph / year"
          value={results.metamorphHoursPerYear.toLocaleString()}
          unit="hours"
          color="text-blue-500 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-950/20"
          border="border-blue-200 dark:border-blue-800/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ResultCard
          label="Hours reclaimed per year"
          value={results.savedHours.toLocaleString()}
          unit="hours saved"
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-950/20"
          border="border-emerald-200 dark:border-emerald-700/40"
          large
        />
        <ResultCard
          label="Estimated value at $150/hr"
          value={`$${results.savedDollars.toLocaleString()}`}
          unit="/ year"
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-950/20"
          border="border-emerald-200 dark:border-emerald-700/40"
          large
        />
      </div>

      <p className="text-xs text-gray-400 dark:text-zinc-600 mt-4 text-center">
        Assumes $150/hr blended engineering rate · 10 min/repo/week with Metamorph dashboard · {results.roi}× efficiency gain
      </p>
    </div>
  );
}

function SliderField({
  label, value, min, max, step, format, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-gray-600 dark:text-zinc-400">{label}</label>
        <span className="text-sm font-semibold font-mono text-gray-900 dark:text-zinc-100">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
      />
      <div className="flex justify-between text-xs text-gray-400 dark:text-zinc-600 mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function ResultCard({
  label, value, unit, color, bg, border, large = false,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  bg: string;
  border: string;
  large?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${bg} ${border}`}>
      <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">{label}</p>
      <p className={`font-bold font-mono ${large ? 'text-3xl' : 'text-2xl'} ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5">{unit}</p>
    </div>
  );
}
