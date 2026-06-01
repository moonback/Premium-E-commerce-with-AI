/**
 * skillsEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Charge les skills depuis prompts/skills/*.md et détecte automatiquement
 * lesquels activer selon le message du client.
 *
 * Chaque skill est un fichier Markdown avec un frontmatter YAML :
 *   ---
 *   name: recommandation
 *   triggers: [recommande, conseil, ...]
 *   priority: 1
 *   ---
 *   # Contenu du skill...
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

export interface Skill {
  name: string;
  triggers: string[];
  priority: number;
  content: string; // Le corps Markdown sans le frontmatter
}

export interface SkillsEngine {
  systemPrompt: string;
  getActiveSkills: (userMessage: string) => Skill[];
  buildContextualInstruction: (userMessage: string) => string;
}

// ── Parseur frontmatter YAML minimal (sans dépendance externe) ────────────────
function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const yamlBlock = match[1];
  const body = match[2];
  const meta: Record<string, unknown> = {};

  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const rawValue = line.slice(colonIdx + 1).trim();

    // Tableau YAML inline : [a, b, c]
    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      meta[key] = rawValue
        .slice(1, -1)
        .split(',')
        .map(v => v.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else if (!isNaN(Number(rawValue)) && rawValue !== '') {
      meta[key] = Number(rawValue);
    } else {
      meta[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
  }

  return { meta, body };
}

// ── Chargement des skills depuis le dossier prompts/skills/ ───────────────────
function loadSkills(skillsDir: string): Skill[] {
  if (!existsSync(skillsDir)) {
    console.warn(`[SkillsEngine] Dossier skills introuvable : ${skillsDir}`);
    return [];
  }

  const files = readdirSync(skillsDir).filter(f => f.endsWith('.md'));
  const skills: Skill[] = [];

  for (const file of files) {
    try {
      const raw = readFileSync(join(skillsDir, file), 'utf-8');
      const { meta, body } = parseFrontmatter(raw);

      const name = typeof meta.name === 'string' ? meta.name : file.replace('.md', '');
      const triggers = Array.isArray(meta.triggers)
        ? (meta.triggers as string[]).map(t => t.toLowerCase())
        : [];
      const priority = typeof meta.priority === 'number' ? meta.priority : 1;

      skills.push({ name, triggers, priority, content: body.trim() });
    } catch (err) {
      console.warn(`[SkillsEngine] Impossible de charger le skill ${file}:`, err);
    }
  }

  // Trier par priorité décroissante
  return skills.sort((a, b) => b.priority - a.priority);
}

// ── Détection des skills actifs selon le message ──────────────────────────────
function detectActiveSkills(message: string, skills: Skill[]): Skill[] {
  const normalized = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const active: Skill[] = [];

  for (const skill of skills) {
    const matched = skill.triggers.some(trigger => {
      const normalizedTrigger = trigger.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normalized.includes(normalizedTrigger);
    });
    if (matched) active.push(skill);
  }

  return active;
}

// ── Factory principale ────────────────────────────────────────────────────────
export function createSkillsEngine(rootDir: string): SkillsEngine {
  const systemPromptPath = join(rootDir, 'prompts', 'ava-system.md');
  const skillsDir = join(rootDir, 'prompts', 'skills');

  // Chargement du prompt système
  let systemPrompt = '';
  if (existsSync(systemPromptPath)) {
    systemPrompt = readFileSync(systemPromptPath, 'utf-8').trim();
  } else {
    console.warn(`[SkillsEngine] Prompt système introuvable : ${systemPromptPath}`);
    systemPrompt = 'Vous êtes Ava, une conseillère IA pour Véridian, une boutique e-commerce premium.';
  }

  // Chargement des skills
  const skills = loadSkills(skillsDir);
  console.log(`[SkillsEngine] ${skills.length} skill(s) chargé(s) : ${skills.map(s => s.name).join(', ')}`);

  return {
    systemPrompt,

    getActiveSkills(userMessage: string): Skill[] {
      return detectActiveSkills(userMessage, skills);
    },

    /**
     * Construit l'instruction contextuelle à injecter dans la session Gemini.
     * Combine le prompt système + les skills actifs détectés dans le message.
     */
    buildContextualInstruction(userMessage: string): string {
      const activeSkills = detectActiveSkills(userMessage, skills);

      if (activeSkills.length === 0) return systemPrompt;

      const skillsBlock = activeSkills
        .map(s => `## Skill actif : ${s.name}\n\n${s.content}`)
        .join('\n\n---\n\n');

      return `${systemPrompt}\n\n---\n\n# Instructions contextuelles activées\n\n${skillsBlock}`;
    },
  };
}
