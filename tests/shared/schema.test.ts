import { describe, it, expect } from 'vitest';
import {
  insertAgentSchema,
  insertSkillSchema,
  insertCommandSchema,
  insertRuleSchema,
  insertProjectSettingsSchema,
  insertHookSchema,
  PERMISSION_MODES,
  AVAILABLE_MODELS,
  AVAILABLE_TOOLS,
  AGENT_ICONS,
  HOOK_EVENTS,
  HOOK_HANDLER_TYPES,
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

  describe('insertRuleSchema', () => {
    it('accepts valid rule data', () => {
      const result = insertRuleSchema.safeParse({
        projectId: 'some-uuid',
        name: 'TypeScript Conventions',
        paths: ['src/**/*.ts'],
        content: 'Use strict mode',
      });
      expect(result.success).toBe(true);
    });

    it('requires projectId', () => {
      const result = insertRuleSchema.safeParse({
        name: 'No Project',
      });
      expect(result.success).toBe(false);
    });

    it('accepts empty paths array', () => {
      const result = insertRuleSchema.safeParse({
        projectId: 'some-uuid',
        name: 'Global Rule',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('insertProjectSettingsSchema', () => {
    it('accepts valid settings data', () => {
      const result = insertProjectSettingsSchema.safeParse({
        projectId: 'some-uuid',
        permissionAllow: ['Read', 'Glob'],
        defaultModel: 'sonnet',
      });
      expect(result.success).toBe(true);
    });

    it('requires projectId', () => {
      const result = insertProjectSettingsSchema.safeParse({
        defaultModel: 'sonnet',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('insertHookSchema', () => {
    it('accepts valid hook data with command handler', () => {
      const result = insertHookSchema.safeParse({
        projectId: 'some-uuid',
        event: 'PreToolUse',
        handlerType: 'command',
        command: 'npm run lint',
        matcher: 'Bash(git commit*)',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid hook data with prompt handler', () => {
      const result = insertHookSchema.safeParse({
        projectId: 'some-uuid',
        event: 'UserPromptSubmit',
        handlerType: 'prompt',
        prompt: 'Check the code',
      });
      expect(result.success).toBe(true);
    });

    it('requires event and handlerType', () => {
      const result = insertHookSchema.safeParse({
        projectId: 'some-uuid',
      });
      expect(result.success).toBe(false);
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

    it('exports HOOK_EVENTS with correct structure', () => {
      expect(HOOK_EVENTS.length).toBe(14);
      const preToolUse = HOOK_EVENTS.find((e) => e.value === 'PreToolUse');
      expect(preToolUse).toBeDefined();
      expect(preToolUse?.group).toBe('Tool');
      expect(preToolUse?.label).toBe('Pre Tool Use');
    });

    it('exports HOOK_HANDLER_TYPES', () => {
      expect(HOOK_HANDLER_TYPES.length).toBe(2);
      expect(HOOK_HANDLER_TYPES.find((t) => t.value === 'command')).toBeDefined();
      expect(HOOK_HANDLER_TYPES.find((t) => t.value === 'prompt')).toBeDefined();
    });
  });
});
