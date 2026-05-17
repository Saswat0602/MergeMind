import { Select, SelectTrigger, SelectContent, SelectItem } from '../ui/select';

interface FiltersBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRepo: string;
  setSelectedRepo: (repo: string) => void;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
  selectedSeverity: 'ALL' | 'CRITICAL' | 'MODERATE' | 'CLEAN';
  setSelectedSeverity: (severity: 'ALL' | 'CRITICAL' | 'MODERATE' | 'CLEAN') => void;
  repositories: string[];
  branches: string[];
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function IconSearch() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export function FiltersBar({
  searchQuery,
  setSearchQuery,
  selectedRepo,
  setSelectedRepo,
  selectedBranch,
  setSelectedBranch,
  selectedSeverity,
  setSelectedSeverity,
  repositories,
  branches,
}: FiltersBarProps) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        alignItems: 'end',
      }}>
        {/* Search */}
        <FilterGroup label="Search">
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center',
            }}>
              <IconSearch />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="PR title, author, commit…"
              className="form-input"
              style={{ paddingLeft: 32 }}
            />
          </div>
        </FilterGroup>

        {/* Repository */}
        <FilterGroup label="Repository">
          <Select value={selectedRepo} onValueChange={setSelectedRepo}>
            <SelectTrigger>
              {selectedRepo === 'ALL' ? 'All Repositories' : selectedRepo}
            </SelectTrigger>
            <SelectContent>
              {repositories.map(repo => (
                <SelectItem key={repo} value={repo}>
                  {repo === 'ALL' ? 'All Repositories' : repo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterGroup>

        {/* Branch */}
        <FilterGroup label="Branch">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger>
              {selectedBranch === 'ALL' ? 'All Branches' : selectedBranch}
            </SelectTrigger>
            <SelectContent>
              {branches.map(branch => (
                <SelectItem key={branch} value={branch}>
                  {branch === 'ALL' ? 'All Branches' : branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterGroup>

        {/* Severity */}
        <FilterGroup label="Severity">
          <Select value={selectedSeverity} onValueChange={val => setSelectedSeverity(val as 'ALL' | 'CRITICAL' | 'MODERATE' | 'CLEAN')}>
            <SelectTrigger>
              {selectedSeverity === 'ALL' && 'All Levels'}
              {selectedSeverity === 'CRITICAL' && 'Critical (> 70)'}
              {selectedSeverity === 'MODERATE' && 'Moderate (30–70)'}
              {selectedSeverity === 'CLEAN' && 'Clean (< 30)'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Levels</SelectItem>
              <SelectItem value="CRITICAL">Critical (&gt; 70)</SelectItem>
              <SelectItem value="MODERATE">Moderate (30–70)</SelectItem>
              <SelectItem value="CLEAN">Clean (&lt; 30)</SelectItem>
            </SelectContent>
          </Select>
        </FilterGroup>
      </div>
    </div>
  );
}
