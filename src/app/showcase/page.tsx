import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import CodeBlock from '@/components/CodeBlock';

export const metadata: Metadata = {
  title: 'Shader & Interaction Library — Metamorph',
  description: 'Copy-paste Three.js and React Three Fiber patterns used in the Metamorph 3D repo graph — fibonacci sphere layout, emissive pulse shaders, camera fly-to animations.',
};

const SNIPPETS = [
  {
    title: 'Fibonacci Sphere Layout',
    description: 'Distributes N nodes evenly across a sphere surface using the golden ratio. Used to position repo nodes within each org cluster — avoids poles and clustering artifacts.',
    language: 'typescript',
    code: `function fibonacciSphere(n: number, radius: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle

  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(n - 1, 1)) * 2; // -1 to 1
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push(new THREE.Vector3(
      Math.cos(theta) * r * radius,
      y * radius,
      Math.sin(theta) * r * radius,
    ));
  }
  return pts;
}

// Usage: 80 nodes on a sphere of radius 120
const positions = fibonacciSphere(80, 120);`,
  },
  {
    title: 'Emissive Pulse (Hidden Gem Shader)',
    description: 'Uses useFrame to animate the emissiveIntensity of a MeshStandardMaterial over time. Hidden gems pulse amber; highlighted repos pulse white at double frequency.',
    language: 'typescript',
    code: `function PulsingNode({ isGem, highlighted }: { isGem: boolean; highlighted: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;

    if (highlighted) {
      // Fast white pulse for AI-highlighted repos
      mat.emissiveIntensity = 0.8 + Math.sin(clock.getElapsedTime() * 4) * 0.2;
    } else if (isGem) {
      // Slow amber pulse for hidden gems
      mat.emissiveIntensity = 0.4 + Math.sin(clock.getElapsedTime() * 2) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 20, 20]} />
      <meshStandardMaterial
        color={isGem ? '#f59e0b' : '#3b82f6'}
        emissive={isGem ? '#f59e0b' : '#3b82f6'}
        emissiveIntensity={isGem ? 0.4 : 0.25}
        roughness={0.3}
        metalness={0.4}
      />
    </mesh>
  );
}`,
  },
  {
    title: 'Camera Fly-To (useFrame Lerp)',
    description: 'Smoothly animates the camera to a target world position by lerping camera.position each frame. Automatically stops when within 2 units of the destination.',
    language: 'typescript',
    code: `function CameraController({ target }: { target: THREE.Vector3 | null }) {
  const { camera } = useThree();
  const currentTarget = useRef<THREE.Vector3 | null>(null);

  // Sync external prop changes into the ref
  useEffect(() => {
    if (target) currentTarget.current = target;
  }, [target]);

  useFrame(() => {
    if (!currentTarget.current) return;

    // Offset camera slightly above and behind the target node
    const dest = currentTarget.current
      .clone()
      .add(new THREE.Vector3(0, 30, 80));

    camera.position.lerp(dest, 0.04); // 0.04 = smooth, 0.1 = snappy

    // Stop lerping once close enough
    if (camera.position.distanceTo(dest) < 2) {
      currentTarget.current = null;
    }
  });

  return null; // no rendered output
}`,
  },
  {
    title: 'Device Capability Detection (LOD)',
    description: 'Detects hardware capabilities on mount and returns quality settings. Used to automatically reduce sphere segments, star count, and canvas DPR on mobile and low-end devices.',
    language: 'typescript',
    code: `interface DeviceCapabilities {
  sphereSegments: number;
  starsCount: number;
  dpr: [number, number];
  autoRotate: boolean;
}

function detectCapabilities(): DeviceCapabilities {
  const lowEnd =
    (navigator.hardwareConcurrency ?? 2) <= 2 ||
    window.innerWidth < 768;

  return {
    sphereSegments: lowEnd ? 8 : 20,   // geometry complexity
    starsCount: lowEnd ? 800 : 3000,    // background star count
    dpr: lowEnd ? [1, 1] : [1, 1.5],   // canvas device pixel ratio
    autoRotate: window.innerWidth >= 768,
  };
}

// In your root component:
const caps = useMemo(() => detectCapabilities(), []);

// Pass to Canvas and Scene
<Canvas dpr={caps.dpr}>
  <Stars count={caps.starsCount} />
  <OrbitControls autoRotate={caps.autoRotate} />
  <sphereGeometry args={[radius, caps.sphereSegments, caps.sphereSegments]} />
</Canvas>`,
  },
  {
    title: 'Custom Event Bus (Cross-Component Communication)',
    description: 'Pattern for dispatching actions between isolated React trees (e.g. SiteGuide → Dashboard → RepoGraph3D) without prop drilling. Used for guide highlighting and insights queries.',
    language: 'typescript',
    code: `// ── Dispatch from SiteGuide ─────────────────────────────────────────────────
window.dispatchEvent(
  new CustomEvent('metamorph-guide-action', {
    detail: {
      repoNames: ['slither', 'echidna'],
      action: 'fly-to',           // 'highlight' | 'fly-to' | 'info'
    },
  })
);

// ── Listen in RepoGraph3D ────────────────────────────────────────────────────
useEffect(() => {
  const handler = (e: Event) => {
    const { repoNames, action } =
      (e as CustomEvent<{ repoNames: string[]; action: string }>).detail;

    setHighlighted(new Set(repoNames));
    if (action === 'fly-to') {
      const target = repoMap.get(repoNames[0]);
      if (target) setFlyTarget(target.worldPos.clone());
    }
    setTimeout(() => setHighlighted(new Set()), 8000);
  };
  window.addEventListener('metamorph-guide-action', handler);
  return () => window.removeEventListener('metamorph-guide-action', handler);
}, [repoMap]);

// ── Listen in Dashboard (table row highlighting) ─────────────────────────────
useEffect(() => {
  const handler = (e: Event) => {
    const { repoNames } =
      (e as CustomEvent<{ repoNames: string[] }>).detail;
    setGuideHighlight(new Set(repoNames));
    setTimeout(() => setGuideHighlight(new Set()), 8000);
  };
  window.addEventListener('metamorph-guide-action', handler);
  return () => window.removeEventListener('metamorph-guide-action', handler);
}, []);`,
  },
];

export default function ShowcasePage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-3">
            Shader & Interaction Library
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 max-w-2xl">
            The Three.js and React Three Fiber patterns powering the Metamorph 3D graph.
            Each snippet is self-contained and copy-paste ready.
          </p>
          <div className="flex items-center gap-3 mt-4 text-xs text-gray-400 dark:text-zinc-600">
            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-zinc-800 font-mono">three ^0.169</span>
            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-zinc-800 font-mono">@react-three/fiber ^8.17</span>
            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-zinc-800 font-mono">@react-three/drei ^9.122</span>
          </div>
        </div>

        <div className="space-y-10">
          {SNIPPETS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">{s.title}</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">{s.description}</p>
              <CodeBlock title={s.title} language={s.language} code={s.code} />
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
            Want to see these patterns in action?
          </p>
          <Link
            href="/3d"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
          >
            Open 3D Graph →
          </Link>
        </div>
      </main>
    </>
  );
}
