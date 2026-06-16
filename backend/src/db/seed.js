require('dotenv').config();
const { sequelize, User, IacTemplate } = require('../models');

const S3_TEMPLATE = `AWSTemplateFormatVersion: '2010-09-09'
Description: Simple S3 Bucket with region and versioning
Parameters:
  BucketName:
    Type: String
    Description: Name of the S3 bucket
  Region:
    Type: String
    Default: us-east-1
    AllowedValues:
      - us-east-1
      - us-west-2
      - eu-west-1
      - ap-southeast-2
    Description: AWS region for the bucket
  EnableVersioning:
    Type: String
    Default: Enabled
    AllowedValues:
      - Enabled
      - Suspended
    Description: Enable or suspend versioning
Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '\${BucketName}-\${Region}'
      VersioningConfiguration:
        Status: !Ref EnableVersioning
Outputs:
  BucketName:
    Value: !Ref S3Bucket
  BucketArn:
    Value: !GetAtt S3Bucket.Arn`;

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // Admin user
    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@cloudplatform.com' },
      defaults: {
        name: 'Admin',
        email: 'admin@cloudplatform.com',
        password: 'Admin@123',
        role: 'Admin',
        status: 'Active',
      },
    });

    if (created) {
      console.log('Admin user created.');
    } else {
      console.log('Admin user already exists.');
    }

    console.log('\nLogin credentials:');
    console.log('  Email:    admin@cloudplatform.com');
    console.log('  Password: Admin@123');

    // S3 CloudFormation template
    const existing = await IacTemplate.findOne({ where: { resourceType: 'S3', isActive: true } });
    if (!existing) {
      await IacTemplate.create({
        resourceType: 'S3',
        provider: 'AWS',
        engine: 'CloudFormation',
        version: 1,
        body: S3_TEMPLATE,
        parameters: ['BucketName', 'Region', 'EnableVersioning'],
        isActive: true,
        createdById: admin.id,
      });
      console.log('S3 CloudFormation template seeded.');
    } else {
      console.log('S3 template already exists, skipping.');
    }

    console.log('\nSeed complete.');
    await sequelize.close();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
