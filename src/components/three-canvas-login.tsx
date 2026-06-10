"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function ThreeCanvasLogin() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 600;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 10;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00afef, 3, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0f62ac, 4, 50);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // 5. Build the 3D Ticket Group
    const ticketGroup = new THREE.Group();
    scene.add(ticketGroup);

    // Create the 2D ticket outline shape with circular notches on left/right
    const shape = new THREE.Shape();
    const w = 4.2;
    const h = 2.5;
    const r = 0.35; // Notch radius

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

    // Extrude the 2D shape to make it a 3D ticket card
    const extrudeSettings = {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    };

    const ticketGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Glassmorphic physical material
    const ticketMat = new THREE.MeshPhysicalMaterial({
      color: 0x00afef,
      emissive: 0x052c56,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.6,
      transmission: 0.65, // Glass effect
      ior: 1.5,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    const ticketBase = new THREE.Mesh(ticketGeo, ticketMat);
    // Center geometry inside the mesh
    ticketGeo.center();
    ticketGroup.add(ticketBase);

    // Add Ticket Details on top of base
    // 5.1 Vertical dashed separator line (Stub Line)
    const stubGroup = new THREE.Group();
    const dashCount = 8;
    const dashGeo = new THREE.BoxGeometry(0.04, 0.12, 0.08);
    const dashMat = new THREE.MeshBasicMaterial({
      color: 0x00afef,
      transparent: true,
      opacity: 0.8,
    });
    for (let i = 0; i < dashCount; i++) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      // Positioned at X = 1.0 (dividing stub on the right)
      dash.position.set(0.9, -h / 2 + 0.15 + ((h - 0.3) / (dashCount - 1)) * i, 0.12);
      stubGroup.add(dash);
    }
    ticketGroup.add(stubGroup);

    // 5.2 Vertical barcode lines on the right stub
    const barcodeGroup = new THREE.Group();
    const barWidths = [0.05, 0.1, 0.03, 0.14, 0.06];
    const barXOffsets = [1.2, 1.34, 1.44, 1.56, 1.68];
    const barMat = new THREE.MeshBasicMaterial({
      color: 0x0f62ac,
      transparent: true,
      opacity: 0.8,
    });
    for (let i = 0; i < barWidths.length; i++) {
      const barGeo = new THREE.BoxGeometry(barWidths[i], 0.9, 0.08);
      const bar = new THREE.Mesh(barGeo, barMat);
      // Center on right stub (around X = 1.4)
      bar.position.set(barXOffsets[i], 0, 0.12);
      barcodeGroup.add(bar);
    }
    ticketGroup.add(barcodeGroup);

    // 5.3 Horizontal glowing fields/text lines on the main ticket body
    const infoGroup = new THREE.Group();
    const infoLines = [
      { w: 1.8, y: 0.45, color: 0x00afef },
      { w: 1.4, y: 0.1, color: 0x0f62ac },
      { w: 1.6, y: -0.25, color: 0x00afef },
    ];
    for (const line of infoLines) {
      const lineGeo = new THREE.BoxGeometry(line.w, 0.08, 0.08);
      const lineMat = new THREE.MeshBasicMaterial({
        color: line.color,
        transparent: true,
        opacity: 0.85,
      });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      // Offset slightly to the left body
      lineMesh.position.set(-0.6, line.y, 0.12);
      infoGroup.add(lineMesh);
    }
    ticketGroup.add(infoGroup);

    // 6. Particle Field (surrounding floating particles)
    const particleCount = 300;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x00afef);
    const color2 = new THREE.Color(0x0f62ac);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3.5 + Math.random() * 2.5; // radius between 3.5 and 6

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);

      const mixedColor = color1.clone().lerp(color2, Math.random());
      colors[i] = mixedColor.r;
      colors[i + 1] = mixedColor.g;
      colors[i + 2] = mixedColor.b;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleTexture = createCircleTexture();
    const particleMat = new THREE.PointsMaterial({
      size: 0.11,
      map: particleTexture,
      transparent: true,
      opacity: 0.65,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    function createCircleTexture() {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, "rgba(255, 255, 255, 1)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(canvas);
    }

    // 7. Interaction
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX - window.innerWidth / 2) * 0.0004;
      targetY = (e.clientY - window.innerHeight / 2) * 0.0004;
    };

    window.addEventListener("mousemove", handleMouseMove);

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

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle continuous ticket rotation & hover floating motion
      ticketGroup.rotation.y = elapsedTime * 0.15;
      ticketGroup.rotation.x = elapsedTime * 0.08;
      
      const floatOffset = Math.sin(elapsedTime * 1.6) * 0.12;
      ticketGroup.position.y = floatOffset;

      // Particles rotation
      particles.rotation.y = elapsedTime * 0.03;
      particles.rotation.x = -elapsedTime * 0.015;

      // Mouse interactive parallax movement (smooth lerp)
      scene.rotation.y += (targetX - scene.rotation.y) * 0.04;
      scene.rotation.x += (targetY - scene.rotation.x) * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      // Dispose resources
      ticketGeo.dispose();
      ticketMat.dispose();
      dashGeo.dispose();
      dashMat.dispose();
      for (let i = 0; i < barcodeGroup.children.length; i++) {
        (barcodeGroup.children[i] as THREE.Mesh).geometry.dispose();
      }
      barMat.dispose();
      for (let i = 0; i < infoGroup.children.length; i++) {
        (infoGroup.children[i] as THREE.Mesh).geometry.dispose();
      }
      particleGeo.dispose();
      particleMat.dispose();
      particleTexture.dispose();
      renderer.dispose();
    };
  }, [mounted]);

  if (!mounted) {
    return <div className="w-full h-full" />;
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px] flex items-center justify-center relative overflow-hidden"
    />
  );
}
