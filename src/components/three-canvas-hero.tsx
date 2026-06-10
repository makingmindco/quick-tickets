"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function ThreeCanvasHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 200;
    const height = container.clientHeight || 200;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup (Close-up perspective)
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.z = 6;

    // Renderer (transparent background)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00afef, 3, 20);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // Geometry - Detailed Icosahedron for high-tech polygon look
    const geometry = new THREE.IcosahedronGeometry(1.4, 1);
    
    // Outer wireframe glowing material
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x00afef,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireframeMesh = new THREE.Mesh(geometry, wireframeMat);
    scene.add(wireframeMesh);

    // Inner solid glowing mesh
    const innerGeo = new THREE.IcosahedronGeometry(0.95, 0);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0x0f62ac,
      emissive: 0x052c56,
      shininess: 80,
      flatShading: true,
      transparent: true,
      opacity: 0.75,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Hover mouse coordinates tracking within the container
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseX = x * 0.003;
      mouseY = y * 0.003;
    };

    container.addEventListener("mousemove", handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow floating rotation
      wireframeMesh.rotation.y = elapsedTime * 0.15;
      wireframeMesh.rotation.x = elapsedTime * 0.08;
      
      innerMesh.rotation.y = -elapsedTime * 0.25;
      innerMesh.rotation.x = -elapsedTime * 0.1;

      // Gentle vertical floating motion
      const floatOffset = Math.sin(elapsedTime * 1.5) * 0.12;
      wireframeMesh.position.y = floatOffset;
      innerMesh.position.y = floatOffset;

      // Mouse interactive tilt (smooth lerp)
      scene.rotation.y += (mouseX - scene.rotation.y) * 0.08;
      scene.rotation.x += (mouseY - scene.rotation.x) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      geometry.dispose();
      wireframeMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      renderer.dispose();
    };
  }, [mounted]);

  if (!mounted) {
    return <div className="w-full h-full" />;
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative overflow-hidden cursor-pointer"
    />
  );
}
