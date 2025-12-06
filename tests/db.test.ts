import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Schema', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a node without errors', async () => {
    const node = await prisma.node.create({
      data: {
        name: 'test-node',
        blockchain: 'bitcoin',
        mode: 'full',
        dataPath: '/tmp/test-node',
        rpcPort: 19001,
        p2pPort: 19002,
        wsPort: null,
        status: 'stopped',
      },
    });

    expect(node.id).toBeDefined();
    await prisma.node.delete({ where: { id: node.id } });
  });
});
