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
    <section className="relative glass-card p-6 border border-white/5 rounded-xl bg-slate-900/5 backdrop-blur-md flex flex-col gap-5 z-20">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Interactive Filters & Search Parameters
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Refine logs by branch name, code repository, severity threat score, or string query.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Search Keywords</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PR, author, commit..."
              className="w-full px-3.5 py-2 bg-[#090b14]/80 border border-slate-800/80 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all duration-300 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Repository Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Filter Repository</label>
          <Select value={selectedRepo} onValueChange={setSelectedRepo}>
            <SelectTrigger>{selectedRepo === 'ALL' ? 'All Repositories' : selectedRepo}</SelectTrigger>
            <SelectContent>
              {repositories.map(repo => (
                <SelectItem key={repo} value={repo}>
                  {repo === 'ALL' ? 'All Repositories' : repo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Branch Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Filter Branch Name</label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="font-mono">{selectedBranch === 'ALL' ? 'All Branches' : selectedBranch}</SelectTrigger>
            <SelectContent>
              {branches.map(branch => (
                <SelectItem key={branch} value={branch}>
                  {branch === 'ALL' ? 'All Branches' : branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Severity Score Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Threat Severity Rating</label>
          <Select value={selectedSeverity} onValueChange={(val) => setSelectedSeverity(val as any)}>
            <SelectTrigger>
              {selectedSeverity === 'ALL' && 'All Levels'}
              {selectedSeverity === 'CRITICAL' && 'Critical Threat (> 70)'}
              {selectedSeverity === 'MODERATE' && 'Moderate Severity (30 - 70)'}
              {selectedSeverity === 'CLEAN' && 'Clean Code (< 30)'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Levels</SelectItem>
              <SelectItem value="CRITICAL">Critical Threat (&gt; 70)</SelectItem>
              <SelectItem value="MODERATE">Moderate Severity (30 - 70)</SelectItem>
              <SelectItem value="CLEAN">Clean Code (&lt; 30)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
