import React from 'react';

import '../styles/skeleton.css';

type Props = {
  height: number;
  className?: string;
};

export default function Skeleton(props: Props) {
  const { height, className } = props;
  return <div style={{ height }} className={`skeleton ${className || ''}`} />;
}
