const { NamingConvention } = require('../models');

/**
 * Resolve a naming convention pattern for an entity type.
 * Tokens: {team}, {project}, {env}, {resource}, {owner}
 */
async function resolve(entityType, tokens = {}) {
  const convention = await NamingConvention.findOne({
    where: { entityType, isActive: true },
    order: [['version', 'DESC']],
  });

  if (!convention) {
    // Default pattern: {project}-{env}-{purpose}
    const { project, env, purpose } = tokens;
    return [project, env, purpose].filter(Boolean).join('-').toLowerCase();
  }

  let name = convention.pattern;
  for (const [key, val] of Object.entries(tokens)) {
    name = name.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val).toLowerCase());
  }
  return name;
}

/**
 * Validate a name against the active convention for an entity type.
 * Returns the name if valid, throws if not.
 */
async function validate(entityType, name) {
  const convention = await NamingConvention.findOne({
    where: { entityType, isActive: true },
    order: [['version', 'DESC']],
  });
  if (!convention) return name; // No rule — pass through

  // Build a regex from the pattern: replace {token} with [\w-]+
  const regexStr = '^' + convention.pattern.replace(/\{[\w]+\}/g, '[\\w-]+') + '$';
  if (!new RegExp(regexStr, 'i').test(name)) {
    throw Object.assign(new Error(`Name "${name}" does not match convention: ${convention.pattern}`), { status: 400 });
  }
  return name;
}

module.exports = { resolve, validate };
