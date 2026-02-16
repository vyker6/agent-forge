import { describe, it, expect } from 'vitest';
import { parseZipBuffer } from '../../server/import-parser';
import AdmZip from 'adm-zip';

describe('Import Parser', () => {
  describe('parseZipBuffer', () => {
    it('extracts files from a zip buffer', async () => {
      const zip = new AdmZip();
      zip.addFile('.claude/CLAUDE.md', Buffer.from('# My Project'));
      zip.addFile('.claude/agents/test-agent.md', Buffer.from('---\nname: test-agent\n---\nYou are a test agent.'));
      zip.addFile('.claude/skills/test-skill/SKILL.md', Buffer.from('---\nname: test-skill\n---\nDo the thing.'));
      zip.addFile('.claude/commands/test-cmd.md', Buffer.from('---\ndescription: A command\n---\nRun it.'));
      zip.addFile('.claude/rules/my-rule.md', Buffer.from('---\npaths:\n  - "src/**"\n---\nUse strict mode.'));
      zip.addFile('.claude/settings.json', Buffer.from('{"defaultModel":"sonnet"}'));

      const buffer = zip.toBuffer();
      const files = await parseZipBuffer(buffer);

      expect(files.length).toBe(6);
      expect(files.find(f => f.path === '.claude/CLAUDE.md')).toBeDefined();
      expect(files.find(f => f.path === '.claude/agents/test-agent.md')).toBeDefined();
      expect(files.find(f => f.path.includes('SKILL.md'))).toBeDefined();
      expect(files.find(f => f.path === '.claude/commands/test-cmd.md')).toBeDefined();
      expect(files.find(f => f.path === '.claude/rules/my-rule.md')).toBeDefined();
      expect(files.find(f => f.path === '.claude/settings.json')).toBeDefined();
    });

    it('skips directories in zip', async () => {
      const zip = new AdmZip();
      zip.addFile('.claude/', Buffer.from(''));
      zip.addFile('.claude/agents/', Buffer.from(''));
      zip.addFile('.claude/agents/agent.md', Buffer.from('content'));

      const buffer = zip.toBuffer();
      const files = await parseZipBuffer(buffer);

      // Only non-directory entries
      const nonEmpty = files.filter(f => f.content.length > 0);
      expect(nonEmpty.length).toBe(1);
      expect(nonEmpty[0].path).toBe('.claude/agents/agent.md');
    });

    it('handles empty zip', async () => {
      const zip = new AdmZip();
      const buffer = zip.toBuffer();
      const files = await parseZipBuffer(buffer);
      expect(files.length).toBe(0);
    });
  });
});
