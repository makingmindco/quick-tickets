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
    camera.position.z = 5;

    // Renderer (transparent background)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00afef, 4, 20);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // Build the Mini 3D Ticket Group
    const ticketGroup = new THREE.Group();
    scene.add(ticketGroup);

    // Create the 2D ticket outline shape with circular notches
    const shape = new THREE.Shape();
    const w = 2.0;
    const h = 1.25;
    const r = 0.18; // Notch radius

    // Top-left to top-right
    shape.moveTo(-w / 2, h / 2);
    shape.lineTo(w / 2, h / 2);

    // Right edge down to notch
    shape.lineTo(w / 2, r);
    // Right notch curving inward
    shape.absarc(w / 2, 0, r, Math.PI / 2, 3 * Math.PI / 2, false);
    // Right edge notch to bottom-right
    shape.lineTo(w / 2, -h / 2);

    // Bottom edge
    shape.lineTo(-w / 2, -h / 2);

    // Left edge up to notch
    shape.lineTo(-w / 2, -r);
    // Left notch curving inward
    shape.absarc(-w / 2, 0, r, -Math.PI / 2, Math.PI / 2, false);
    // Left edge notch to top-left
    shape.lineTo(-w / 2, h / 2);

    // Extrude Settings (making it a mini 3D card)
    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    };

    const ticketGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    ticketGeo.center();

    // Glassmorphic physical material
    const ticketMat = new THREE.MeshPhysicalMaterial({
      color: 0x00afef,
      emissive: 0x052c56,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65,
      transmission: 0.7, // glass
      ior: 1.5,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    const ticketBase = new THREE.Mesh(ticketGeo, ticketMat);
    ticketGroup.add(ticketBase);

    // Vertical dashed stub line
    const stubGroup = new THREE.Group();
    const dashCount = 6;
    const dashGeo = new THREE.BoxGeometry(0.02, 0.07, 0.04);
    const dashMat = new THREE.MeshBasicMaterial({
      color: 0x00afef,
      transparent: true,
      opacity: 0.8,
    });
    for (let i = 0; i < dashCount; i++) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      // Positioned at X = 0.4 (dividing stub on the right)
      dash.position.set(0.4, -h / 2 + 0.1 + ((h - 0.2) / (dashCount - 1)) * i, 0.08);
      stubGroup.add(dash);
    }
    ticketGroup.add(stubGroup);

    // Horizontal glowing fields/text lines on the left body
    const infoGroup = new THREE.Group();
    const infoLines = [
      { w: 0.8, y: 0.22, color: 0x00afef },
      { w: 0.6, y: 0.0, color: 0x0f62ac },
      { w: 0.7, y: -0.22, color: 0x00afef },
    ];
    for (const line of infoLines) {
      const lineGeo = new THREE.BoxGeometry(line.w, 0.04, 0.04);
      const lineMat = new THREE.MeshBasicMaterial({
        color: line.color,
        transparent: true,
        opacity: 0.85,
      });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.set(-0.3, line.y, 0.08);
      infoGroup.add(lineMesh);
    }
    ticketGroup.add(infoGroup);

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

      // Continuous ticket rotation & hover floating motion
      ticketGroup.rotation.y = elapsedTime * 0.2;
      ticketGroup.rotation.x = elapsedTime * 0.1;
      
      const floatOffset = Math.sin(elapsedTime * 1.5) * 0.1;
      ticketGroup.position.y = floatOffset;

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
      
      ticketGeo.dispose();
      ticketMat.dispose();
      dashGeo.dispose();
      dashMat.dispose();
      for (let i = 0; i < infoGroup.children.length; i++) {
        (infoGroup.children[i] as THREE.Mesh).geometry.dispose();
      }
      infoMat.dispose();
      renderer.dispose();
    };
  }, [mounted]);

  const infoMat = new THREE.MeshBasicMaterial(); // Holder to prevent TS errors on cleanup scope

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
