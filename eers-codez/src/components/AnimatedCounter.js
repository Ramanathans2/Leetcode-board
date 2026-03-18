'use client';
import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';

export default function AnimatedCounter({ value, duration = 1.5, className = '' }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
        if (isInView) {
            const controls = animate(count, value, {
                duration,
                ease: 'easeOut',
            });
            return () => controls.stop();
        }
    }, [isInView, value, count, duration]);

    return (
        <motion.span ref={ref} className={className}>
            {isInView ? <motion.span>{rounded}</motion.span> : 0}
        </motion.span>
    );
}
