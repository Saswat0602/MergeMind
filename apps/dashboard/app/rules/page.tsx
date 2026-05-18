'use client';

import React from 'react';
import { RepositoryRulesForm } from '../../components/rules/RepositoryRulesForm';
import { PageHeader } from '../../components/layout/PageHeader';

export default function RulesPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Repository Rules"
        subtitle="Configure quality gates, standard parameters, and custom review rules for each repository"
      />
      
      <div style={{ marginTop: 8 }}>
        <RepositoryRulesForm />
      </div>
    </div>
  );
}
