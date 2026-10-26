async function check() {
  try {
    const { default: prisma } = await import('./prisma');
    try {
      const userCount = await prisma.user.count();
      if (userCount > 0) {
        process.exit(0); // Ready & seeded
      } else {
        process.exit(1); // Connected, but needs seed
      }
    } finally {
      await prisma.$disconnect();
    }
  } catch (err) {
    process.exit(2); // Needs schema push / generate + seed
  }
}

check();
