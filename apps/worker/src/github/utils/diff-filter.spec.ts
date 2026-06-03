import { filterAndTruncateDiff, getFilePathFromDiffBlock } from './diff-filter';

describe('diff-filter', () => {
  it('should parse file path from standard diff block', () => {
    const block = `diff --git a/apps/dashboard/public/logo.png b/apps/dashboard/public/logo.png
index 123456..789012 100644
--- a/apps/dashboard/public/logo.png
+++ b/apps/dashboard/public/logo.png
Binary files differ`;
    expect(getFilePathFromDiffBlock(block)).toBe(
      'apps/dashboard/public/logo.png',
    );
  });

  it('should filter out media files and lockfiles', () => {
    const diff = `diff --git a/apps/dashboard/public/logo.png b/apps/dashboard/public/logo.png
index 123456..789012 100644
--- a/apps/dashboard/public/logo.png
+++ b/apps/dashboard/public/logo.png
Binary files differ
diff --git a/package-lock.json b/package-lock.json
index 111..222 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,3 +1,4 @@
+ "version": "1.0.0"
diff --git a/src/index.ts b/src/index.ts
index 333..444 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,2 +1,3 @@
 const x = 1;
+const y = 2;`;

    const { filteredDiff, skippedCount, skippedSummary } =
      filterAndTruncateDiff(diff);
    expect(skippedCount).toBe(2);
    expect(filteredDiff).toContain('src/index.ts');
    expect(filteredDiff).not.toContain('logo.png');
    expect(filteredDiff).not.toContain('package-lock.json');
  });

  it('should filter out files exceeding line limits', () => {
    // Generate a massive block with 10,005 lines
    const lines = [
      'diff --git a/src/massive.ts b/src/massive.ts',
      '--- a/src/massive.ts',
      '+++ b/src/massive.ts',
    ];
    for (let i = 0; i < 10005; i++) {
      lines.push(`+ const line${i} = ${i};`);
    }
    const diff = lines.join('\n');

    const { filteredDiff, skippedCount, skippedSummary } =
      filterAndTruncateDiff(diff);
    expect(skippedCount).toBe(1);
    expect(filteredDiff).toBe('');
    expect(skippedSummary[0]).toContain('too large');
  });
});
