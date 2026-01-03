import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MousePointer2 } from 'lucide-react';

// --- Types ---

interface Particle {
    x: number;
    y: number;
    originX: number;
    originY: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    angle: number; // For some organic oscillation
}

interface BackgroundParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    phase: number;
}

interface MouseState {
    x: number;
    y: number;
    isActive: boolean;
}

// --- Configuration Constants ---

const PARTICLE_DENSITY = 0.00015; // Particles per pixel squared (adjust for density)
const BG_PARTICLE_DENSITY = 0.00005; // Less dense for background
const MOUSE_RADIUS = 180; // Radius of mouse influence
const RETURN_SPEED = 0.08; // How fast particles fly back to origin (spring constant)
const DAMPING = 0.90; // Friction (velocity decay)
const REPULSION_STRENGTH = 1.2; // Multiplier for mouse push force

// --- Helper Functions ---

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// --- Components ---

export const AntiGravityCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mutable state refs
    const particlesRef = useRef<Particle[]>([]);
    const backgroundParticlesRef = useRef<BackgroundParticle[]>([]);
    const mouseRef = useRef<MouseState>({ x: -1000, y: -1000, isActive: false });
    const frameIdRef = useRef<number>(0);

    // Theme colors ref (updated on resize/init)
    const colorsRef = useRef({
        primary: 'rgb(16, 185, 129)', // Emerald-500 default
        foreground: 'rgb(255, 255, 255)',
        background: 'transparent'
    });

    // Helper to get CSS variable value
    const getCssVar = (name: string, fallback: string) => {
        if (typeof window === 'undefined') return fallback;
        const val = getComputedStyle(document.body).getPropertyValue(name).trim();
        // Handle HSL values if necessary, but for now assuming hex/rgb or tailwind handles
        // If the vars are HSL (common in shadcn), we might need conversion or just use a known robust fallback color for now.
        // For simplicity/reliability in this fix, we will sniff the "dark" class on document.documentElement
        return val || fallback;
    };

    const isDarkMode = () => document.documentElement.classList.contains('dark');

    // Initialize Particles with Theme Awareness
    const initParticles = useCallback((width: number, height: number) => {
        const isDark = isDarkMode();

        // Set dynamic colors
        const primaryColor = isDark ? '#34d399' : '#059669'; // Emerald-400 (Dark) vs Emerald-600 (Light)
        const baseColor = isDark ? '#ffffff' : '#1e293b'; // White vs Slate-800

        colorsRef.current = {
            primary: primaryColor,
            foreground: baseColor,
            background: 'transparent'
        };

        // 1. Main Interactive Particles
        const particleCount = Math.floor(width * height * PARTICLE_DENSITY);
        const newParticles: Particle[] = [];

        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;

            newParticles.push({
                x: x,
                y: y,
                originX: x,
                originY: y,
                vx: 0,
                vy: 0,
                size: randomRange(1, 2.5),
                // 10% chance of being the primary accent color
                color: Math.random() > 0.9 ? primaryColor : baseColor,
                angle: Math.random() * Math.PI * 2,
            });
        }
        particlesRef.current = newParticles;

        // 2. Background Ambient Particles
        const bgCount = Math.floor(width * height * BG_PARTICLE_DENSITY);
        const newBgParticles: BackgroundParticle[] = [];

        for (let i = 0; i < bgCount; i++) {
            newBgParticles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                size: randomRange(0.5, 1.5),
                alpha: randomRange(0.1, 0.4),
                phase: Math.random() * Math.PI * 2
            });
        }
        backgroundParticlesRef.current = newBgParticles;
    }, []);

    // Animation Loop
    const animate = useCallback((time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dynamic Colors from Ref
        const { primary, foreground } = colorsRef.current;

        // --- Background Effects ---

        // 1. Gentle Ambient Glow (using Primary color)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const pulseSpeed = 0.0008;
        const pulseOpacity = Math.sin(time * pulseSpeed) * 0.035 + 0.085;

        // Convert hex/rgb to rgba string for gradient
        // Simple hack: assume primary is standard enough or just use hardcoded transparent version for the glow
        // We'll use a safe emerald fallback for the glow to ensure it works
        const glowColor = isDarkMode() ? '34, 197, 94' : '5, 150, 105'; // Green-500 vs Green-600

        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(canvas.width, canvas.height) * 0.7
        );
        gradient.addColorStop(0, `rgba(${glowColor}, ${pulseOpacity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Background Particles
        ctx.fillStyle = foreground;
        const bgParticles = backgroundParticlesRef.current;

        for (let i = 0; i < bgParticles.length; i++) {
            const p = bgParticles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            const twinkle = Math.sin(time * 0.002 + p.phase) * 0.5 + 0.5;
            const currentAlpha = p.alpha * (0.3 + 0.7 * twinkle);

            ctx.globalAlpha = currentAlpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // --- Main Particles ---
        const particles = particlesRef.current;
        const mouse = mouseRef.current;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // Physics: Mouse Repulsion
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (mouse.isActive && distance < MOUSE_RADIUS) {
                const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
                const repulsion = force * REPULSION_STRENGTH;
                p.vx -= (dx / distance) * repulsion * 5;
                p.vy -= (dy / distance) * repulsion * 5;
            }

            // Physics: Spring Return
            p.vx += (p.originX - p.x) * RETURN_SPEED;
            p.vy += (p.originY - p.y) * RETURN_SPEED;

            // Physics: Collision (Simplified for performance)
            // Omitted complex collision loop for simpler "Hero" performance

            // Update
            p.vx *= DAMPING;
            p.vy *= DAMPING;
            p.x += p.vx;
            p.y += p.vy;

            // Draw
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

            // Dynamic Opacity based on speed
            const velocity = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const opacity = Math.min(0.4 + velocity * 0.1, 1);

            // Apply color (handle hex transparency manually if needed, or just set globalAlpha)
            ctx.globalAlpha = opacity;
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        frameIdRef.current = requestAnimationFrame(animate);
    }, []);

    // Resize Monitor
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;

                canvasRef.current.width = width * dpr;
                canvasRef.current.height = height * dpr;
                canvasRef.current.style.width = '100%';
                canvasRef.current.style.height = '100%';

                const ctx = canvasRef.current.getContext('2d');
                if (ctx) ctx.scale(dpr, dpr);

                initParticles(width, height);
            }
        };

        window.addEventListener('resize', handleResize);
        // Also listen for theme changes
        const observer = new MutationObserver(() => handleResize());
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, [initParticles]);

    // Global Mouse Handling (since canvas is behind content)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                isActive: true
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current.isActive = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
        };
    }, []);

    // Start Loop
    useEffect(() => {
        frameIdRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameIdRef.current);
    }, [animate]);

    return (
        <div ref={containerRef} className="w-full h-full pointer-events-none bg-transparent">
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
};

