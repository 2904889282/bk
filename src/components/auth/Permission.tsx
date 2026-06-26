import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface Props { code: string; children: React.ReactNode; fallback?: React.ReactNode; }
export default function Permission({ code, children, fallback = null }: Props) {
  const hasPermission = useAuth(s => s.hasPermission(code));
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
