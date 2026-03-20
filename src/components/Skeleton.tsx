import React from 'react';

interface SkeletonProps {
  className?: string;
}

const joinClasses = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(' ');

export const SkeletonBlock: React.FC<SkeletonProps> = ({ className }) => (
  <div className={joinClasses('skeleton-shimmer rounded-xl', className)} aria-hidden="true" />
);

export const SkeletonCircle: React.FC<SkeletonProps> = ({ className }) => (
  <SkeletonBlock className={joinClasses('rounded-full', className)} />
);
