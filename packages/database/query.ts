import { PrismaService } from './index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaService();

async function main() {
  await prisma.onModuleInit();
  
  const settings = await prisma.gitHubSettings.findFirst();
  console.log('=== GITHUB SETTINGS ===');
  console.log(settings ? { ...settings, privateKey: settings.privateKey ? '[REDACTED]' : null } : 'None');

  const installations = await prisma.gitHubInstallation.findMany();
  console.log('=== GITHUB INSTALLATIONS ===');
  console.log(installations.length ? installations : 'None');

  const repos = await prisma.repository.findMany();
  console.log('=== REGISTERED REPOSITORIES ===');
  console.log(repos.length ? repos.map(r => ({ name: r.name, fullName: r.fullName, isActive: r.isActive })) : 'None');

  const prs = await prisma.pullRequest.findMany();
  console.log('=== REGISTERED PRS ===');
  console.log(prs.length ? prs.map(p => ({ number: p.number, title: p.title, state: p.state })) : 'None');
}

main().catch(err => {
  console.error(err);
}).finally(async () => {
  await prisma.onModuleDestroy();
});
