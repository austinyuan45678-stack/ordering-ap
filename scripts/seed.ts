import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const adminPhone = "18529510460";
  const existingAdmin = await prisma.user.findUnique({ where: { phone: adminPhone } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        phone: adminPhone,
        name: "Admin",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log("Admin user created");
  } else {
    // If it exists, make sure it's an admin
    await prisma.user.update({
      where: { phone: adminPhone },
      data: { role: "ADMIN" }
    });
    console.log("Existing user updated to Admin");
  }
}

main().catch(console.error);
