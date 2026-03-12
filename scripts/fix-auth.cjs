/**
 * Supprime l'utilisateur orphelin (sans Account) pour permettre une nouvelle connexion
 * Exécuter : node scripts/fix-auth.cjs
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const usersWithoutAccounts = await prisma.user.findMany({
    where: { accounts: { none: {} } },
    select: { id: true, email: true },
  });

  for (const user of usersWithoutAccounts) {
    await prisma.user.delete({ where: { id: user.id } });
    console.log("Supprimé :", user.email);
  }

  if (usersWithoutAccounts.length === 0) {
    console.log("Aucun utilisateur orphelin à supprimer.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
