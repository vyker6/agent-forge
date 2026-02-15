import { describe, it, expect } from 'vitest';
import {
  insertAgentSchema,
  insertSkillSchema,
  insertCommandSchema,
  PERMISSION_MODES,
  AVAILABLE_MODELS,
  AVAILABLE_TOOLS,
  AGENT_ICONS,
} from '../../shared/schema';

describe('Schema', () => {
  describe('insertAgentSchema', () => {
    it('accepts valid agent data', () => {
      const result = insertAgentSchema.safeParse({
        name: 'Test Agent',
        description: 'A test agent',
        systemPrompt: 'You are a test agent.',
        model: 'sonnet',
        color: '#FF0000',
      });
      expect(result.success).toBe(true);
    });

    it('requires name field', () => {
      const result = insertAgentSchema.safeParse({
        description: 'Missing name',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('insertSkillSchema', () => {
    it('accepts valid skill data', () => {
      const result = insertSkillSchema.safeParse({
        agentId: 'some-uuid',
        name: 'Test Skill',
        description: 'A test skill',
        instructions: 'Do the thing',
      });
      expect(result.success).toBe(true);
    });

    it('requires agentId', () => {
      const result = insertSkillSchema.safeParse({
        name: 'No Agent',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('insertCommandSchema', () => {
    it('accepts valid command data', () => {
      const result = insertCommandSchema.safeParse({
        agentId: 'some-uuid',
        name: 'Test Command',
        description: 'A test command',
        promptTemplate: 'Do $ARGUMENTS',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Constants', () => {
    it('exports PERMISSION_MODES with default option', () => {
      const defaultMode = PERMISSION_MODES.find((m) => m.value === 'default');
      expect(defaultMode).toBeDefined();
      expect(PERMISSION_MODES.length).toBeGreaterThan(0);
    });

    it('exports AVAILABLE_MODELS with sonnet', () => {
      const sonnet = AVAILABLE_MODELS.find((m) => m.value === 'sonnet');
      expect(sonnet).toBeDefined();
    });

    it('exports AVAILABLE_TOOLS', () => {
      expect(AVAILABLE_TOOLS).toContain('Read');
      expect(AVAILABLE_TOOLS).toContain('Bash');
      expect(AVAILABLE_TOOLS.length).toBeGreaterThan(0);
    });

    it('exports AGENT_ICONS', () => {
      expect(AGENT_ICONS).toContain('bot');
      expect(AGENT_ICONS.length).toBeGreaterThan(0);
    });
  });
});
