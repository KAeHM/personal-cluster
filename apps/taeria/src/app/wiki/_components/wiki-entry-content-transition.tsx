"use client";

import { motion, useReducedMotion } from "motion/react";

type WikiEntryContentTransitionProps = {
  children: React.ReactNode;
  delay?: number;
};

function WikiEntryContentTransition({
  children,
  delay = 0,
}: WikiEntryContentTransitionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ y: 16 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export { WikiEntryContentTransition };
