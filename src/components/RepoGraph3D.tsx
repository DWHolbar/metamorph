'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Repo, DeltaResult } from '@/lib/types';
import { markRepoViewed } from '@/lib/userProgress';

// ── Device capability detection (LOD) ────────────────────────────────────────
interface DeviceCapabilities {
  sphereSegments: number;
  starsCount: number;
  dpr: [number, number];
  autoRotate: boolean;
}

function detectCapabilities(): DeviceCapabilities {
  const lowEnd = (navigator.hardwareConcurrency ?? 2) <= 2 || window.innerWidth < 768;
  return {
    sphereSegments: lowEnd ? 10 : 24,
    starsCount: lowEnd ? 1500 : 6000,
    dpr: lowEnd ? [1, 1] : [1, 2],
    autoRotate: window.innerWidth >= 768,
  };
}

// ── Org config — vivid, distinct palette with wider separation ────────────────
const ORG_CONFIG = {
  trailofbits: {
    color: '#38bdf8',
    emissive: '#0ea5e9',
    light: '#38bdf8',
    center: new THREE.Vector3(-280, 0, 80),
    label: 'trailofbits',
  },
  crytic: {
    color: '#c084fc',
    emissive: '#a855f7',
    light: '#c084fc',
    center: new THREE.Vector3(280, 0, 80),
    label: 'crytic',
  },
  'lifting-bits': {
    color: '#fb923c',
    emissive: '#f97316',
    light: '#fb923c',
    center: new THREE.Vector3(0, 0, -340),
    label: 'lifting-bits',
  },
} as const;

// ── Fibonacci sphere layout ───────────────────────────────────────────────────
function fibonacciSphere(n: number, radius: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(n - 1, 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
  }
  return pts;
}

function nodeRadius(stars: number) {
  return Math.log10(stars + 1) * 3.8 + 2.5;
}

// ── Repo node ─────────────────────────────────────────────────────────────────
interface NodeProps {
  repo: Repo;
  position: THREE.Vector3;
  baseColor: string;
  emissiveColor: string;
  visited: boolean;
  highlighted: boolean;
  sphereSegments: number;
  showLabel: boolean;
}

function RepoNode({ repo, position, baseColor, emissiveColor, visited, highlighted, sphereSegments, showLabel }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const radius = nodeRadius(repo.stars);
  const isGem = repo.isHiddenGem;
  const isNew = repo.isNew;
  const nodeColor = isGem ? '#fbbf24' : baseColor;
  const nodeEmissive = isGem ? '#f59e0b' : emissiveColor;
  const studioUrl = `/content-studio?repo=${encodeURIComponent(repo.name)}&org=${encodeURIComponent(repo.org)}`;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (highlighted) {
      mat.emissiveIntensity = 1.0 + Math.sin(clock.getElapsedTime() * 5) * 0.3;
    } else if (isGem) {
      mat.emissiveIntensity = 0.5 + Math.sin(clock.getElapsedTime() * 1.8) * 0.35;
    }
    if (hovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.12);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  function handleClick() {
    window.open(repo.htmlUrl, '_blank', 'noopener,noreferrer');
    markRepoViewed(repo.org, repo.name);
  }

  const opacity = visited ? 0.45 : 1;
  const emissiveInt = highlighted ? 1.0 : (visited ? 0.05 : (isGem ? 0.5 : 0.3));

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[radius, sphereSegments, sphereSegments]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={highlighted ? '#ffffff' : nodeEmissive}
          emissiveIntensity={emissiveInt}
          transparent
          opacity={opacity}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* Outer glow shell for gems */}
      {isGem && (
        <mesh>
          <sphereGeometry args={[radius * 1.35, 12, 12]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.07} side={THREE.BackSide} />
        </mesh>
      )}

      {/* New-repo halo ring */}
      {isNew && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.7, 0.3, 8, 40]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Permanent floating label for notable repos */}
      {showLabel && !hovered && (
        <Text
          position={[0, radius + 4, 0]}
          fontSize={3.2}
          color={isGem ? '#fbbf24' : nodeColor}
          anchorX="center"
          anchorY="bottom"
          renderOrder={1}
        >
          {repo.name}
        </Text>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html distanceFactor={90} center>
          <div className="bg-gray-950/98 border border-gray-700 rounded-xl px-3 py-2.5 shadow-2xl min-w-[190px] max-w-[250px]">
            <p className="font-mono font-bold text-white text-sm leading-tight pointer-events-none">{repo.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 pointer-events-none">{repo.org}</p>
            {repo.description && (
              <p className="text-xs text-gray-300 mt-1.5 leading-snug line-clamp-2 pointer-events-none">{repo.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 pointer-events-none">
              <span>★ {repo.stars.toLocaleString()}</span>
              {repo.language && <span>· {repo.language}</span>}
              {isGem && <span className="text-amber-400 font-semibold">· Hidden Gem</span>}
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700/60">
              <a
                href={studioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-[10px] px-2 py-1 rounded-md bg-sky-600/80 hover:bg-sky-500 text-white transition-colors font-medium"
              >
                Generate content →
              </a>
              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] px-2 py-1 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-200 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Cluster boundary ring ─────────────────────────────────────────────────────
function ClusterRing({ center, color, radius }: { center: THREE.Vector3; color: string; radius: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.06 + Math.sin(clock.getElapsedTime() * 0.4) * 0.03;
    }
  });
  return (
    <mesh ref={meshRef} position={center} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.88, radius * 1.08, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.07} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Org cluster ───────────────────────────────────────────────────────────────
function OrgCluster({ repos, center, color, emissive, visited, highlighted, sphereSegments }: {
  repos: Repo[];
  center: THREE.Vector3;
  color: string;
  emissive: string;
  visited: Set<string>;
  highlighted: Set<string>;
  sphereSegments: number;
}) {
  const clusterRadius = Math.max(50, Math.sqrt(repos.length) * 20);
  const positions = fibonacciSphere(repos.length, clusterRadius);

  // Top 4 repos by stars get permanent labels
  const topNames = useMemo(() => {
    const sorted = [...repos].sort((a, b) => b.stars - a.stars);
    return new Set(sorted.slice(0, 4).map((r) => r.name));
  }, [repos]);

  return (
    <group position={center}>
      {repos.map((repo, i) => (
        <RepoNode
          key={`${repo.org}/${repo.name}`}
          repo={repo}
          position={positions[i]}
          baseColor={color}
          emissiveColor={emissive}
          visited={visited.has(`${repo.org}/${repo.name}`)}
          highlighted={highlighted.has(repo.name)}
          sphereSegments={sphereSegments}
          showLabel={topNames.has(repo.name) || repo.isHiddenGem}
        />
      ))}
      <ClusterRing center={new THREE.Vector3(0, 0, 0)} color={color} radius={clusterRadius} />
    </group>
  );
}

// ── Org label ─────────────────────────────────────────────────────────────────
function OrgLabel({ center, label, color }: { center: THREE.Vector3; label: string; color: string }) {
  return (
    <Text
      position={[center.x, center.y + 95, center.z]}
      fontSize={10}
      color={color}
      anchorX="center"
      anchorY="middle"
      fontWeight="bold"
      outlineWidth={0.5}
      outlineColor="#000000"
    >
      {label}
    </Text>
  );
}

// ── Camera fly-to controller ──────────────────────────────────────────────────
function CameraController({ target }: { target: THREE.Vector3 | null }) {
  const { camera } = useThree();
  const currentTarget = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (target) currentTarget.current = target;
  }, [target]);

  useFrame(() => {
    if (!currentTarget.current) return;
    const dest = currentTarget.current.clone().add(new THREE.Vector3(0, 40, 100));
    camera.position.lerp(dest, 0.04);
    if (camera.position.distanceTo(dest) < 2) currentTarget.current = null;
  });

  return null;
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function Scene({ repos, visited, highlighted, flyTarget, caps }: {
  repos: Repo[];
  visited: Set<string>;
  highlighted: Set<string>;
  flyTarget: THREE.Vector3 | null;
  caps: DeviceCapabilities;
}) {
  const byOrg = {
    trailofbits: repos.filter((r) => r.org === 'trailofbits'),
    crytic: repos.filter((r) => r.org === 'crytic'),
    'lifting-bits': repos.filter((r) => r.org === 'lifting-bits'),
  };

  return (
    <>
      {/* Atmosphere */}
      <color attach="background" args={['#040412']} />
      <fog attach="fog" args={['#040412', 600, 1400]} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 300, 0]} intensity={0.8} color="#8ecae6" />
      {/* Per-org accent lights */}
      <pointLight position={[-280, 60, 80]} intensity={2.5} color={ORG_CONFIG.trailofbits.light} distance={400} />
      <pointLight position={[280, 60, 80]} intensity={2.5} color={ORG_CONFIG.crytic.light} distance={400} />
      <pointLight position={[0, 60, -340]} intensity={2.5} color={ORG_CONFIG['lifting-bits'].light} distance={400} />

      <Stars radius={700} depth={120} count={caps.starsCount} factor={6} fade saturation={0.3} />

      {(Object.keys(byOrg) as (keyof typeof byOrg)[]).map((org) => (
        <OrgCluster
          key={org}
          repos={byOrg[org]}
          center={ORG_CONFIG[org].center}
          color={ORG_CONFIG[org].color}
          emissive={ORG_CONFIG[org].emissive}
          visited={visited}
          highlighted={highlighted}
          sphereSegments={caps.sphereSegments}
        />
      ))}

      {(Object.keys(ORG_CONFIG) as (keyof typeof ORG_CONFIG)[]).map((org) => (
        <OrgLabel
          key={org}
          center={ORG_CONFIG[org].center}
          label={ORG_CONFIG[org].label}
          color={ORG_CONFIG[org].color}
        />
      ))}

      <CameraController target={flyTarget} />
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        autoRotate={caps.autoRotate}
        autoRotateSpeed={0.18}
        minDistance={40}
        maxDistance={900}
      />
    </>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="absolute bottom-6 left-6 flex flex-col gap-2 pointer-events-none">
      {Object.entries(ORG_CONFIG).map(([org, cfg]) => (
        <div key={org} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
          <span className="text-xs text-gray-300 font-mono">{org}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-1">
        <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" style={{ boxShadow: '0 0 6px #f59e0b' }} />
        <span className="text-xs text-gray-300 font-mono">Hidden Gem</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full border-2 border-slate-200 flex-shrink-0" />
        <span className="text-xs text-gray-300 font-mono">New repo (≤30d)</span>
      </div>
      <p className="text-[10px] text-gray-500 mt-2">
        Sphere size = GitHub stars<br />
        Labels = top repos + hidden gems<br />
        Drag to rotate · Scroll to zoom
      </p>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
const CACHE_KEY_PREFIX = 'delta-';

export default function RepoGraph3D({ showInsights, onInsightsDismiss }: {
  showInsights?: boolean;
  onInsightsDismiss?: () => void;
}) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [flyTarget, setFlyTarget] = useState<THREE.Vector3 | null>(null);
  const [repoMap, setRepoMap] = useState<Map<string, Repo & { worldPos: THREE.Vector3 }>>(new Map());
  const caps = useMemo(() => detectCapabilities(), []);

  useEffect(() => {
    const hourKey = `${CACHE_KEY_PREFIX}${new Date().toISOString().slice(0, 13)}`;
    try {
      const raw = localStorage.getItem(hourKey);
      if (raw) {
        const d = JSON.parse(raw) as DeltaResult;
        if (Array.isArray(d.repos)) { setRepos(d.repos); setLoading(false); return; }
      }
    } catch {}
    fetch('/api/delta').then((r) => r.json()).then((d: DeltaResult) => {
      if (Array.isArray(d.repos)) setRepos(d.repos);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('metamorph-user-progress');
      if (raw) {
        const p = JSON.parse(raw) as { viewedRepos?: string[] };
        setVisited(new Set(p.viewedRepos ?? []));
      }
    } catch {}
    const handler = () => {
      try {
        const raw = localStorage.getItem('metamorph-user-progress');
        if (raw) {
          const p = JSON.parse(raw) as { viewedRepos?: string[] };
          setVisited(new Set(p.viewedRepos ?? []));
        }
      } catch {}
    };
    window.addEventListener('metamorph-progress-updated', handler);
    return () => window.removeEventListener('metamorph-progress-updated', handler);
  }, []);

  useEffect(() => {
    const map = new Map<string, Repo & { worldPos: THREE.Vector3 }>();
    const byOrg: Record<string, Repo[]> = { trailofbits: [], crytic: [], 'lifting-bits': [] };
    for (const r of repos) byOrg[r.org]?.push(r);
    for (const org of Object.keys(byOrg) as (keyof typeof ORG_CONFIG)[]) {
      const clusterRepos = byOrg[org];
      const clusterRadius = Math.max(50, Math.sqrt(clusterRepos.length) * 20);
      const positions = fibonacciSphere(clusterRepos.length, clusterRadius);
      clusterRepos.forEach((r, i) => {
        const worldPos = positions[i].clone().add(ORG_CONFIG[org].center);
        map.set(r.name, { ...r, worldPos });
      });
    }
    setRepoMap(map);
  }, [repos]);

  const handleGuideAction = useCallback((e: Event) => {
    const detail = (e as CustomEvent<{ repoNames: string[]; action: string }>).detail;
    const names = new Set(detail.repoNames);
    setHighlighted(names);
    if (detail.action === 'fly-to' && detail.repoNames[0]) {
      const target = repoMap.get(detail.repoNames[0]);
      if (target) setFlyTarget(target.worldPos.clone());
    }
    setTimeout(() => setHighlighted(new Set()), 8000);
  }, [repoMap]);

  useEffect(() => {
    window.addEventListener('metamorph-guide-action', handleGuideAction);
    return () => window.removeEventListener('metamorph-guide-action', handleGuideAction);
  }, [handleGuideAction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#040412] text-gray-500 text-sm">
        Loading repo graph…
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#040412]">
      <Canvas camera={{ position: [0, 100, 550], fov: 52 }} dpr={caps.dpr}>
        <Scene repos={repos} visited={visited} highlighted={highlighted} flyTarget={flyTarget} caps={caps} />
      </Canvas>
      <Legend />
      {highlighted.size > 0 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-emerald-900/80 border border-emerald-700 text-emerald-300 text-sm font-medium pointer-events-none">
          {highlighted.size} repo{highlighted.size !== 1 ? 's' : ''} highlighted by guide
        </div>
      )}
      {showInsights && repos.length > 0 && (
        <PerformanceInsightsOverlay repos={repos} onDismiss={onInsightsDismiss} />
      )}
    </div>
  );
}

// ── Performance Insights Overlay ─────────────────────────────────────────────
function PerformanceInsightsOverlay({ repos, onDismiss }: { repos: Repo[]; onDismiss?: () => void }) {
  const byOrg = useMemo(() => {
    const map: Record<string, { total: number; gems: number; topStars: number; topName: string }> = {};
    for (const r of repos) {
      if (!map[r.org]) map[r.org] = { total: 0, gems: 0, topStars: 0, topName: '' };
      map[r.org].total++;
      if (r.isHiddenGem) map[r.org].gems++;
      if (r.stars > map[r.org].topStars) { map[r.org].topStars = r.stars; map[r.org].topName = r.name; }
    }
    return map;
  }, [repos]);

  const mostRecent = useMemo(() =>
    repos.reduce((a, b) => new Date(a.pushedAt) > new Date(b.pushedAt) ? a : b, repos[0]),
    [repos]
  );

  const handleAskAI = () => {
    window.dispatchEvent(new CustomEvent('metamorph-insights-query', {
      detail: { query: 'What are the top performing repos across all orgs? Which hidden gems should I focus on?' }
    }));
  };

  const ORG_COLORS: Record<string, string> = {
    trailofbits: 'text-sky-400',
    crytic: 'text-purple-400',
    'lifting-bits': 'text-orange-400',
  };

  return (
    <div className="absolute top-4 right-4 w-72 bg-gray-950/96 border border-gray-700/60 rounded-xl p-4 shadow-2xl text-sm z-40 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-white flex items-center gap-1.5">
          <span>⚡</span> Performance Insights
        </span>
        {onDismiss && (
          <button onClick={onDismiss} className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
      <div className="space-y-2 mb-3">
        {Object.entries(byOrg).map(([org, stats]) => (
          <div key={org} className="bg-gray-800/60 rounded-lg px-3 py-2">
            <p className={`font-mono text-xs font-semibold ${ORG_COLORS[org] ?? 'text-gray-300'}`}>{org}</p>
            <p className="text-gray-300 text-xs mt-0.5">
              {stats.total} repos · <span className="text-amber-400">{stats.gems} gems</span>
            </p>
            <p className="text-gray-500 text-[10px] mt-0.5">
              Top: <span className="text-gray-300 font-mono">{stats.topName}</span> ({stats.topStars.toLocaleString()} ★)
            </p>
          </div>
        ))}
      </div>
      {mostRecent && (
        <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-lg px-3 py-2 mb-3">
          <p className="text-emerald-400 text-[10px] uppercase tracking-wide font-semibold">Most Recently Active</p>
          <p className="text-white font-mono text-xs mt-0.5">{mostRecent.name}</p>
          <p className="text-gray-500 text-[10px]">{new Date(mostRecent.pushedAt).toLocaleDateString()}</p>
        </div>
      )}
      <button
        onClick={handleAskAI}
        className="w-full text-xs px-3 py-1.5 rounded-lg bg-sky-700/80 hover:bg-sky-600 text-white transition-colors"
      >
        Ask AI Guide about trends →
      </button>
    </div>
  );
}
