import type { PrismaConfig } from 'prisma';

export default {
  earlyAccess: true,
  schema: './src/schema.prisma',
} satisfies PrismaConfig;
