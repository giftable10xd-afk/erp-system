import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const passwordHash = await hash("Engineer123!");
const user = await prisma.user.upsert({
  where: { username: "eng1" },
  update: {},
  create: {
    username: "eng1",
    passwordHash,
    fullNameAr: "المهندس كريم",
    isActive: true,
  },
});

const role = await prisma.role.findUniqueOrThrow({ where: { key: "engineer" } });
await prisma.userRole.upsert({
  where: { userId_roleId: { userId: user.id, roleId: role.id } },
  update: {},
  create: { userId: user.id, roleId: role.id },
});

console.log("created test engineer user: eng1 / Engineer123!");
await prisma.$disconnect();
