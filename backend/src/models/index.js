const sequelize = require('../config/database');
const User = require('./User');
const Team = require('./Team');
const Project = require('./Project');
const Account = require('./Account');
const Request = require('./Request');
const Resource = require('./Resource');
const Conversation = require('./Conversation');
const Message = require('./Message');
const NamingConvention = require('./NamingConvention');
const IacTemplate = require('./IacTemplate');
const AuditLog = require('./AuditLog');
const AccessRule = require('./AccessRule');

// User <-> Team (many-to-many)
const UserTeam = sequelize.define('UserTeam', {}, { timestamps: false });
User.belongsToMany(Team, { through: UserTeam, as: 'teams' });
Team.belongsToMany(User, { through: UserTeam, as: 'members' });

// Team manager
Team.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

// Team <-> Project (many-to-many) — teams are granted access to projects
const TeamProject = sequelize.define('TeamProject', {}, { timestamps: false });
Team.belongsToMany(Project, { through: TeamProject, as: 'projects' });
Project.belongsToMany(Team, { through: TeamProject, as: 'teams' });

// Project -> Account (region is stored on Project)
Project.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// Request — account/region derived from Project at creation time, stored for audit
Request.belongsTo(User, { foreignKey: 'requestedById', as: 'requestedBy' });
Request.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
Request.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Request.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// Resource
Resource.belongsTo(Request, { foreignKey: 'requestId', as: 'request' });
Resource.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// Conversation
Conversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Conversation.belongsTo(Request, { foreignKey: 'requestId', as: 'request' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

// AuditLog
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// IacTemplate
IacTemplate.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

module.exports = {
  sequelize,
  User,
  Team,
  Project,
  Account,
  Request,
  Resource,
  Conversation,
  Message,
  NamingConvention,
  IacTemplate,
  AuditLog,
  AccessRule,
  UserTeam,
  TeamProject,
};
