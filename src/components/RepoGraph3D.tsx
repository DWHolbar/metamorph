'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Repo, DeltaResult } from '@/lib/types';
import { markRepoViewed } from '@/lib/userProgress';

// ── Org config ────────────────────────────────────────────────────────────────
const ORG_CONFIG = {
  trailofbits: { color: '#3b82f6', center: new THREE.Vector3(-180, 0, 0), label: 'trailofbits' },
  crytic:       { color: '#a855f7', center: new THREE.Vector3(180, 0, 0),  label: 'crytic' },
  'lifting-bits': { color: '#f97316', center: new THREE.Vector3(0, 0, -220), label: 'lifting-bits' },
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
  return Math.log10(stars + 1) * 2.5 + 1.2;
}

// ── Repo node ─────────────────────────────────────────────────────────────────
interface NodeProps {
  repo: Repo;
  position: THREE.Vector3;
  baseColor: string;
  visited: boolean;
  highlighted: boolean;
}

function RepoNode({ repo, position, baseColor, visited, highlighted }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const radius = nodeRadius(repo.stars);
  const isGem = repo.isHiddenGem;
  const isNew = repo.isNew;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (isGem) {
      mat.emissiveIntensity = 0.4 + Math.sin(clock.getElapsedTime() * 2) * 0.3;
    }
    if (highlighted) {
      mat.emissiveIntensity = 0.8 + Math.sin(clock.getElapsedTime() * 4) * 0.2;
    }
    if (hovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.25, 1.25, 1.25), 0.15);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  function handleClick() {
    window.open(repo.htmlUrl, '_blank', 'noopener,noreferrer');
    markRepoViewed(repo.org, repo.name);
  }

  const emissiveColor = highlighted ? '#ffffff' : (isGem ? '#f59e0b' : baseColor);
  const emissiveIntensity = visited ? 0.1 : (isGem ? 0.4 : 0.25);
  const opacity = visited ? 0.55 : 1;

  return (
    <group position={position}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[radius, 20, 20]} />
        <meshStandardMaterial
          color={isGem ? '#f59e0b' : baseColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={opacity}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* New-repo halo ring */}
      {isNew && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.6, 0.25, 8, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Tooltip on hover */}
      {hovered && (
        <Html distanceFactor={80} center>
          <div className="pointer-events-none bg-gray-900/95 dark:bg-zinc-950/95 border border-gray-700 dark:border-zinc-700 rounded-xl px-3 py-2.5 shadow-xl min-w-[180px] max-w-[240px]">
            <p className="font-mono font-bold text-white text-sm leading-tight">{repo.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{repo.org}</p>
            {repo.description && (
              <p className="text-xs text-gray-300 mt-1.5 leading-snug line-clamp-2">{repo.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
              <span>★ {repo.stars.toLocaleString()}</span>
              {repo.language && <span>· {repo.language}</span>}
              {isGem && <span className="text-amber-400">· Hidden Gem</span>}
            </div>
            <p className="text-[10px] text-gray-600 mt-1">Click to open on GitHub</p>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Org cluster ───────────────────────────────────────────────────────────────
function OrgCluster({ repos, center, color, visited, highlighted }: {
  repos: Repo[];
  center: THREE.Vector3;
  color: string;
  visited: Set<string>;
  highlighted: Set<string>;
}) {
  const clusterRadius = Math.max(40, Math.sqrt(repos.length) * 18);
  const positions = fibonacciSphere(repos.length, clusterRadius);

  return (
    <group position={center}>
      {repos.map((repo, i) => (
        <RepoNode
          key={`${repo.org}/${repo.name}`}
          repo={repo}
          position={positions[i]}
          baseColor={color}
          visited={visited.has(`${repo.org}/${repo.name}`)}
          highlighted={highlighted.has(repo.name)}
        />
      ))}
    </group>
  );
}

// ── Org label ─────────────────────────────────────────────────────────────────
function OrgLabel({ center, label, color }: { center: THREE.Vector3; label: string; color: string }) {
  return (
    <Text
      position={[center.x, center.y + 75, center.z]}
      fontSize={8}
      color={color}
      anchorX="center"
      anchorY="middle"
      fontWeight="bold"
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
    const dest = currentTarget.current.clone().add(new THREE.Vector3(0, 30, 80));
    camera.position.lerp(dest, 0.04);
    if (camera.position.distanceTo(dest) < 2) currentTarget.current = null;
  });

  return null;
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function Scene({ repos, visited, highlighted, flyTarget }: {
  repos: Repo[];
  visited: Set<string>;
  highlighted: Set<string>;
  flyTarget: THREE.Vector3 | null;
}) {
  const byOrg = {
    trailofbits: repos.filter((r) => r.org === 'trailofbits'),
    crytic: repos.filter((r) => r.org === 'crytic'),
    'lifting-bits': repos.filter((r) => r.org === 'lifting-bits'),
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[200, 200, 200]} intensity={1.2} />
      <pointLight position={[-200, -100, -200]} intensity={0.6} color="#8b5cf6" />
      <Stars radius={600} depth={80} count={3000} factor={5} fade />

      {(Object.keys(byOrg) as (keyof typeof byOrg)[]).map((org) => (
        <OrgCluster
          key={org}
          repos={byOrg[org]}
          center={ORG_CONFIG[org].center}
          color={ORG_CONFIG[org].color}
          visited={visited}
          highlighted={highlighted}
        />
      ))}

      {(Object.keys(ORG_CONFIG) as (keyof typeof ORG_CONFIG)[]).map((org) => (
        <OrgLabel key={org} center={ORG_CONFIG[org].center} label={ORG_CONFIG[org].label} color={ORG_CONFIG[org].color} />
      ))}

      <CameraController target={flyTarget} />
      <OrbitControls
        enableDamping
        dampingFactor={0.07}
        autoRotate
        autoRotateSpeed={0.25}
        minDistance={30}
        maxDistance={700}
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
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
          <span className="text-xs text-gray-300 font-mono">{org}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-1">
        <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
        <span className="text-xs text-gray-300 font-mono">Hidden Gem</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full border-2 border-white flex-shrink-0" />
        <span className="text-xs text-gray-300 font-mono">New repo (≤30d)</span>
      </div>
      <p className="text-[10px] text-gray-500 mt-2">Sphere size = GitHub stars<br />Drag to rotate · Scroll to zoom</p>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
const CACHE_KEY_PREFIX = 'delta-';

export default function RepoGraph3D() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [flyTarget, setFlyTarget] = useState<THREE.Vector3 | null>(null);
  const [repoMap, setRepoMap] = useState<Map<string, Repo & { worldPos: THREE.Vector3 }>>(new Map());

  // Load repos
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

  // Load visited from localStorage
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

  // Build world-position map for fly-to
  useEffect(() => {
    const map = new Map<string, Repo & { worldPos: THREE.Vector3 }>();
    const byOrg: Record<string, Repo[]> = { trailofbits: [], crytic: [], 'lifting-bits': [] };
    for (const r of repos) byOrg[r.org]?.push(r);
    for (const org of Object.keys(byOrg) as (keyof typeof ORG_CONFIG)[]) {
      const clusterRepos = byOrg[org];
      const clusterRadius = Math.max(40, Math.sqrt(clusterRepos.length) * 18);
      const positions = fibonacciSphere(clusterRepos.length, clusterRadius);
      clusterRepos.forEach((r, i) => {
        const worldPos = positions[i].clone().add(ORG_CONFIG[org].center);
        map.set(r.name, { ...r, worldPos });
      });
    }
    setRepoMap(map);
  }, [repos]);

  // Listen for guide actions
  const handleGuideAction = useCallback((e: Event) => {
    const detail = (e as CustomEvent<{ repoNames: string[]; action: string }>).detail;
    const names = new Set(detail.repoNames);
    setHighlighted(names);
    if (detail.action === 'fly-to' && detail.repoNames[0]) {
      const target = repoMap.get(detail.repoNames[0]);
      if (target) setFlyTarget(target.worldPos.clone());
    }
    // Clear highlight after 8s
    setTimeout(() => setHighlighted(new Set()), 8000);
  }, [repoMap]);

  useEffect(() => {
    window.addEventListener('metamorph-guide-action', handleGuideAction);
    return () => window.removeEventListener('metamorph-guide-action', handleGuideAction);
  }, [handleGuideAction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400 text-sm">
        Loading repo graph…
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-950">
      <Canvas camera={{ position: [0, 80, 450], fov: 55 }} dpr={[1, 1.5]}>
        <Scene repos={repos} visited={visited} highlighted={highlighted} flyTarget={flyTarget} />
      </Canvas>
      <Legend />
      {highlighted.size > 0 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-emerald-900/80 border border-emerald-700 text-emerald-300 text-sm font-medium pointer-events-none">
          {highlighted.size} repo{highlighted.size !== 1 ? 's' : ''} highlighted by guide
        </div>
      )}
    </div>
  );
}
