require('dotenv').config();
const { sequelize } = require('../models');

async function clean() {
  await sequelize.authenticate();
  const q = (sql) => sequelize.query(sql);

  await q(`TRUNCATE TABLE "Messages", "Conversations", "Resources", "Requests", "AuditLogs", "AccessRules", "TeamProjects", "UserTeams", "IacTemplates", "NamingConventions", "Projects", "Teams", "Accounts" CASCADE`);
  await q(`DELETE FROM "Users" WHERE email != 'admin@cloudplatform.com'`);

  const [users] = await q(`SELECT name, email, role, status FROM "Users"`);
  console.log('Remaining users:', JSON.stringify(users, null, 2));
  console.log('Done — all data cleared except admin user.');
  await sequelize.close();
}

clean().catch((e) => { console.error('Cleanup failed:', e.message); process.exit(1); });
