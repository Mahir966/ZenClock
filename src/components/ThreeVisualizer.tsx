'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useZenClock } from '@/context/ZenClockContext';

interface ThreeVisualizerProps {
  isRunning?: boolean;
  progress?: number;
  mode?: 'timer' | 'study' | 'stopwatch' | 'clock';
}

export const ThreeVisualizer: React.FC<ThreeVisualizerProps> = ({
  isRunning = false,
  progress = 0,
  mode = 'timer',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { preferences, isAlarmActive } = useZenClock();

  useEffect(() => {
    if (!preferences.enable3D || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 24;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (e) {
      console.warn('WebGL not supported or disabled:', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for mouse parallax tilt
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Particle Torus / Orbital Halo
    const particleCount = 1400;
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);

    const isDark = preferences.theme === 'dark';
    const primaryColor = isDark ? new THREE.Color(0x38bdf8) : new THREE.Color(0x0284c7);
    const secondaryColor = isDark ? new THREE.Color(0x818cf8) : new THREE.Color(0x4f46e5);
    const alertColor = new THREE.Color(0xef4444);

    for (let i = 0; i < particleCount; i++) {
      // Golden spiral distribution along torus
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const R = 9.5 + (Math.random() - 0.5) * 2.2;
      const r = 2.4 + (Math.random() - 0.5) * 1.5;

      posArray[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
      posArray[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u);
      posArray[i * 3 + 2] = r * Math.sin(v);

      const mix = Math.random();
      const col = primaryColor.clone().lerp(secondaryColor, mix);
      colorArray[i * 3] = col.r;
      colorArray[i * 3 + 1] = col.g;
      colorArray[i * 3 + 2] = col.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.65 : 0.45,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    mainGroup.add(particles);

    // 2. Subtle Geodesic Wireframe Sphere
    const sphereGeo = new THREE.IcosahedronGeometry(7.2, 1);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.08 : 0.05,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    mainGroup.add(sphereMesh);

    // 3. Ambient inner gyroscopic ring
    const ringGeo = new THREE.TorusGeometry(8.5, 0.04, 8, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x93c5fd : 0x2563eb,
      transparent: true,
      opacity: isDark ? 0.25 : 0.15,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    mainGroup.add(ringMesh);

    // Mouse tilt tracking
    let targetX = 0;
    let targetY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 0.4;
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (document.hidden) return; // Battery saving when inactive

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax
      mainGroup.rotation.y += (targetX - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (-targetY - mainGroup.rotation.x) * 0.05;

      // Base rotation speed adjusts based on whether timer is running or alarm is active
      const speedMultiplier = isAlarmActive ? 3.5 : isRunning ? 1.6 : 0.6;

      particles.rotation.z += 0.002 * speedMultiplier;
      particles.rotation.y += 0.001 * speedMultiplier;

      sphereMesh.rotation.x -= 0.0015 * speedMultiplier;
      sphereMesh.rotation.y += 0.002 * speedMultiplier;

      ringMesh.rotation.z += 0.003 * speedMultiplier;

      // Breathing scale effect
      const breathe = Math.sin(elapsedTime * (isRunning ? 2.2 : 1.2)) * 0.04 + 1.0;
      mainGroup.scale.set(breathe, breathe, breathe);

      // Color tint shift if alarm is active
      if (isAlarmActive) {
        particleMaterial.color.set(alertColor);
        particleMaterial.opacity = 0.9;
      } else {
        particleMaterial.color.set(0xffffff);
        particleMaterial.opacity = isDark ? 0.65 : 0.45;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        try {
          container.removeChild(renderer.domElement);
        } catch {
          // ignore
        }
      }
      particleGeometry.dispose();
      particleMaterial.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, [preferences.enable3D, preferences.theme, isRunning, isAlarmActive, progress, mode]);

  if (!preferences.enable3D) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-80 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
};
