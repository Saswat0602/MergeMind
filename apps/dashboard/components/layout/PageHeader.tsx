import React from 'react';
import Link from 'next/link';

interface PageHeaderProps {
  /** Breadcrumb link label, e.g. "Dashboard" */
  backLabel?: string;
  /** Breadcrumb link href */
  backHref?: string;
  /** Optional small tag shown next to breadcrumb */
  breadcrumbTag?: string;
  /** Main page title */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Optional action buttons rendered on the right */
  actions?: React.ReactNode;
}

export function PageHeader({
  backLabel,
  backHref,
  breadcrumbTag,
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        {(backLabel || breadcrumbTag) && (
          <div className="page-breadcrumb">
            {backLabel && backHref && (
              <Link
                href={backHref}
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                ← {backLabel}
              </Link>
            )}
            {breadcrumbTag && (
              <>
                {backLabel && <span style={{ color: 'var(--border-soft)' }}>/</span>}
                <span style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 5,
                  padding: '1px 7px',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace',
                }}>
                  {breadcrumbTag}
                </span>
              </>
            )}
          </div>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
