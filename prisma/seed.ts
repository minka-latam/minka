import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// User data with passwords for Supabase auth
const userData = [
  {
    email: "admin@minka.com",
    password: "Minka2024!",
    name: "Admin Principal",
    role: "admin" as const,
    bio: "Administrador del sistema Minka",
    location: "La Paz",
  },
  {
    email: "tester@minka.com",
    password: "Test123!",
    name: "María González",
    role: "organizer" as const,
    bio: "Activista ambiental comprometida con la protección de áreas naturales en Bolivia",
    location: "Santa Cruz",
  },
  {
    email: "tester2@minka.com",
    password: "Test123!",
    name: "Carlos Mamani",
    role: "organizer" as const,
    bio: "Educador rural dedicado a mejorar las oportunidades educativas en comunidades indígenas",
    location: "La Paz",
  },
  {
    email: "tester3@minka.com",
    password: "Test123!",
    name: "Ana Pérez",
    role: "organizer" as const,
    bio: "Artista y gestora cultural que promueve las tradiciones bolivianas",
    location: "Cochabamba",
  },
  {
    email: "tester4@minka.com",
    password: "Test123!",
    name: "Jorge Gutiérrez",
    role: "user" as const,
    bio: "Voluntario en proyectos de ayuda humanitaria",
    location: "Beni",
  },
  {
    email: "tester5@minka.com",
    password: "Test123!",
    name: "Patricia Rojas",
    role: "organizer" as const,
    bio: "Médica comprometida con mejorar la salud en zonas rurales",
    location: "Oruro",
  },
  {
    email: "donor1@minka.com",
    password: "Test123!",
    name: "Luis Fernández",
    role: "user" as const,
    bio: "Empresario boliviano que apoya causas sociales",
    location: "Santa Cruz",
  },
  {
    email: "donor2@minka.com",
    password: "Test123!",
    name: "Gabriela Torres",
    role: "user" as const,
    bio: "Profesional interesada en proyectos de impacto social",
    location: "Cochabamba",
  },
];

// Campaign images data (using Unsplash for realistic images)
const campaignImages = {
  medioambiente: [
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
  ],
  educacion: [
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800",
  ],
  cultura_arte: [
    "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
    "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800",
    "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800",
  ],
  emergencia: [
    "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800",
    "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800",
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
  ],
  salud: [
    "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800",
    "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800",
  ],
};

const campaignData = [
  {
    title: "Protección del Parque Nacional Amboró",
    description:
      "Campaña para proteger la biodiversidad del Parque Nacional Amboró en Santa Cruz",
    story:
      "El Parque Nacional Amboró es hogar de más de 800 especies de aves y está en peligro debido a la deforestación y caza ilegal. Esta campaña busca financiar guardaparques y equipos de monitoreo para proteger esta área natural vital. Con tu apoyo, podremos establecer puntos de vigilancia, capacitar a guardaparques locales y crear programas de educación ambiental para las comunidades cercanas.",
    beneficiariesDescription:
      "Las comunidades locales, la biodiversidad del parque y las futuras generaciones se beneficiarán de la conservación de este ecosistema único.",
    category: "medioambiente",
    location: "santa_cruz",
    goalAmount: 50000,
    daysFromNow: 90,
    organizerEmail: "tester@minka.com",
  },
  {
    title: "Escuela para niños de la comunidad Aymara",
    description:
      "Construcción de una escuela para niños de comunidades rurales aymaras",
    story:
      "Los niños de las comunidades rurales aymaras carecen de infraestructura educativa adecuada. Esta campaña busca construir una escuela que beneficiará a más de 200 niños, brindándoles acceso a educación de calidad. La escuela incluirá aulas modernas, biblioteca, sala de computación y áreas recreativas. Además, se incorporarán elementos de la cultura aymara en el diseño y currículo.",
    beneficiariesDescription:
      "Más de 200 niños y niñas de comunidades aymaras tendrán acceso a educación de calidad en su propia lengua y cultura.",
    category: "educacion",
    location: "la_paz",
    goalAmount: 80000,
    daysFromNow: 120,
    organizerEmail: "tester2@minka.com",
  },
  {
    title: "Festival de Arte y Cultura Boliviana",
    description:
      "Organización de un festival que celebra la diversidad cultural de Bolivia",
    story:
      "Este festival busca reunir artistas de todo el país para mostrar la riqueza cultural boliviana. Se realizarán exposiciones, performances y talleres abiertos al público para fomentar el aprecio por nuestras tradiciones. El evento incluirá música tradicional, danzas folklóricas, artesanías, gastronomía y artes visuales de todas las regiones de Bolivia.",
    beneficiariesDescription:
      "Artistas bolivianos, artesanos y la comunidad en general se beneficiarán de este espacio de intercambio cultural.",
    category: "cultura_arte",
    location: "cochabamba",
    goalAmount: 30000,
    daysFromNow: 60,
    organizerEmail: "tester3@minka.com",
  },
  {
    title: "Apoyo a damnificados por inundaciones",
    description:
      "Ayuda para familias afectadas por las recientes inundaciones en Beni",
    story:
      "Las recientes inundaciones en el departamento de Beni han dejado a cientos de familias sin hogar. Esta campaña busca proporcionar alimentos, agua potable y refugio temporal a los afectados mientras reconstruyen sus vidas. Los fondos se destinarán a kits de emergencia, carpas, alimentos no perecederos, agua embotellada, y materiales de construcción para ayudar a las familias a reconstruir sus hogares.",
    beneficiariesDescription:
      "Más de 500 familias afectadas por las inundaciones recibirán ayuda inmediata y apoyo para la reconstrucción.",
    category: "emergencia",
    location: "beni",
    goalAmount: 100000,
    daysFromNow: 45,
    organizerEmail: "tester4@minka.com",
  },
  {
    title: "Equipamiento para hospital comunitario",
    description:
      "Compra de equipos médicos para mejorar la atención en hospital rural",
    story:
      "El hospital comunitario de Oruro carece de equipos médicos esenciales para atender adecuadamente a la población rural. Con esta campaña buscamos adquirir monitores cardíacos, equipos de ultrasonido y material quirúrgico básico. Estos equipos permitirán realizar diagnósticos más precisos y tratamientos más efectivos, salvando vidas en comunidades que antes debían viajar horas para recibir atención médica especializada.",
    beneficiariesDescription:
      "Más de 15,000 personas de comunidades rurales tendrán acceso a atención médica de calidad sin necesidad de desplazarse a la ciudad.",
    category: "salud",
    location: "oruro",
    goalAmount: 75000,
    daysFromNow: 100,
    organizerEmail: "tester5@minka.com",
  },
  {
    title: "Huertos comunitarios para seguridad alimentaria",
    description:
      "Implementación de huertos urbanos en barrios vulnerables de La Paz",
    story:
      "La inseguridad alimentaria afecta a muchas familias en zonas periurbanas de La Paz. Este proyecto busca crear huertos comunitarios que provean alimentos frescos y saludables, mientras se enseñan técnicas de agricultura urbana sostenible. Los huertos también servirán como espacios de encuentro comunitario y educación ambiental para niños y jóvenes.",
    beneficiariesDescription:
      "100 familias tendrán acceso a alimentos frescos y aprenderán técnicas de agricultura sostenible.",
    category: "igualdad",
    location: "la_paz",
    goalAmount: 25000,
    daysFromNow: 75,
    organizerEmail: "tester2@minka.com",
  },
  {
    title: "Biblioteca móvil para comunidades rurales",
    description: "Llevar libros y educación a comunidades alejadas de Potosí",
    story:
      "Muchas comunidades rurales en Potosí no tienen acceso a bibliotecas o material de lectura. Esta campaña busca equipar una biblioteca móvil que visitará diferentes comunidades, ofreciendo préstamo de libros, actividades de lectura y talleres educativos. El vehículo estará equipado con libros en español, quechua y aymara, materiales didácticos y tecnología para proyecciones educativas.",
    beneficiariesDescription:
      "Más de 30 comunidades rurales tendrán acceso regular a libros y actividades educativas.",
    category: "educacion",
    location: "potosi",
    goalAmount: 45000,
    daysFromNow: 110,
    organizerEmail: "tester@minka.com",
  },
];

async function main() {
  console.log("🌱 Starting enhanced seed process...\n");

  // Step 1: Create Supabase auth users and profiles
  console.log("=== Step 1: Creating Supabase Auth Users and Profiles ===\n");
  const createdProfiles: any[] = [];

  for (const user of userData) {
    try {
      // Check if profile already exists
      const existingProfile = await prisma.profile.findUnique({
        where: { email: user.email },
      });

      if (existingProfile) {
        console.log(`✓ Profile for ${user.email} already exists`);
        createdProfiles.push(existingProfile);
        continue;
      }

      // Create auth user in Supabase
      console.log(`Creating Supabase auth user for ${user.email}...`);
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            name: user.name,
          },
        });

      if (authError) {
        console.error(`✗ Error creating auth user for ${user.email}:`, authError.message);
        continue;
      }

      if (!authData.user) {
        console.error(`✗ No user data returned for ${user.email}`);
        continue;
      }

      console.log(`  ✓ Created Supabase auth user`);

      // Create profile in database
      const profile = await prisma.profile.create({
        data: {
          id: authData.user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          identityNumber: `CI-${Math.floor(Math.random() * 10000000)
            .toString()
            .padStart(7, "0")}`,
          birthDate: new Date(
            1980 + Math.floor(Math.random() * 30),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          ),
          passwordHash: "supabase-managed",
          phone: `+591 ${Math.floor(Math.random() * 90000000) + 10000000}`,
          location: user.location,
          bio: user.bio,
          verificationStatus: true,
          profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
        },
      });

      createdProfiles.push(profile);
      console.log(`  ✓ Created profile in database\n`);
    } catch (error: any) {
      console.error(`✗ Error processing user ${user.email}:`, error.message);
    }
  }

  console.log(`\n✅ Created ${createdProfiles.length} profiles\n`);

  // Step 2: Create campaigns with multiple images
  console.log("=== Step 2: Creating Campaigns with Media ===\n");
  const createdCampaigns: any[] = [];

  for (const campaign of campaignData) {
    try {
      const organizer = await prisma.profile.findUnique({
        where: { email: campaign.organizerEmail },
      });

      if (!organizer) {
        console.log(`✗ Organizer ${campaign.organizerEmail} not found, skipping campaign`);
        continue;
      }

      const existingCampaign = await prisma.campaign.findFirst({
        where: {
          title: campaign.title,
          organizerId: organizer.id,
        },
      });

      if (existingCampaign) {
        console.log(`✓ Campaign "${campaign.title}" already exists, skipping`);
        createdCampaigns.push(existingCampaign);
        continue;
      }

      console.log(`Creating campaign: "${campaign.title}"...`);

      const endDate = new Date(Date.now() + campaign.daysFromNow * 24 * 60 * 60 * 1000);
      const daysRemaining = campaign.daysFromNow;

      const createdCampaign = await prisma.campaign.create({
        data: {
          title: campaign.title,
          description: campaign.description,
          story: campaign.story,
          beneficiariesDescription: campaign.beneficiariesDescription,
          category: campaign.category as any,
          goalAmount: campaign.goalAmount,
          collectedAmount: 0,
          percentageFunded: 0,
          daysRemaining,
          location: campaign.location as any,
          endDate,
          campaignStatus: "active",
          organizerId: organizer.id,
          youtubeUrls: [],
          verificationStatus: true,
        },
      });

      // Add multiple images for each campaign
      const images = campaignImages[campaign.category as keyof typeof campaignImages] || [];
      for (let i = 0; i < Math.min(images.length, 3); i++) {
        await prisma.campaignMedia.create({
          data: {
            campaignId: createdCampaign.id,
            mediaUrl: images[i],
            type: "image",
            isPrimary: i === 0,
            orderIndex: i,
            status: "active",
          },
        });
      }

      // Update organizer's active campaign count
      await prisma.profile.update({
        where: { id: organizer.id },
        data: {
          activeCampaignsCount: {
            increment: 1,
          },
        },
      });

      createdCampaigns.push(createdCampaign);
      console.log(`  ✓ Created campaign with ${Math.min(images.length, 3)} images\n`);
    } catch (error: any) {
      console.error(`✗ Error creating campaign "${campaign.title}":`, error.message);
    }
  }

  console.log(`\n✅ Created ${createdCampaigns.length} campaigns\n`);

  // Step 3: Create donations and notifications
  console.log("=== Step 3: Creating Donations and Notifications ===\n");
  let donationCount = 0;

  const donors = createdProfiles.filter((p) => p.email.includes("donor") || p.role === "user");

  for (const campaign of createdCampaigns) {
    try {
      // Create 3-5 donations per campaign
      const numDonations = Math.floor(Math.random() * 3) + 3;

      for (let i = 0; i < numDonations && i < donors.length; i++) {
        const donor = donors[i];
        const organizer = await prisma.profile.findUnique({
          where: { id: campaign.organizerId },
        });

        if (!organizer || donor.id === campaign.organizerId) continue;

        const donationAmount = [100, 250, 500, 1000, 2500][Math.floor(Math.random() * 5)];
        const messages = [
          "¡Excelente iniciativa! Espero que logren su meta.",
          "Felicidades por este hermoso proyecto. Cuentan con mi apoyo.",
          "Me encanta ver proyectos que ayudan a nuestra comunidad.",
          "¡Adelante con este gran proyecto!",
          "Un granito de arena para esta noble causa.",
        ];

        const donation = await prisma.donation.create({
          data: {
            campaignId: campaign.id,
            donorId: donor.id,
            amount: donationAmount,
            paymentMethod: ["credit_card", "qr", "bank_transfer"][Math.floor(Math.random() * 3)] as any,
            paymentStatus: "completed",
            message: messages[Math.floor(Math.random() * messages.length)],
            isAnonymous: Math.random() > 0.7,
            notificationEnabled: true,
          },
        });

        // Update campaign stats
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            collectedAmount: {
              increment: donationAmount,
            },
            donorCount: {
              increment: 1,
            },
          },
        });

        // Create notification for organizer
        await prisma.notification.create({
          data: {
            userId: organizer.id,
            type: "donation_received",
            title: "Nueva donación recibida",
            message: `Has recibido una donación de ${donationAmount} BOB para tu campaña "${campaign.title}"`,
            campaignId: campaign.id,
            donationId: donation.id,
          },
        });

        donationCount++;
      }

      // Update percentage funded
      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: campaign.id },
      });

      if (updatedCampaign) {
        const percentageFunded =
          (Number(updatedCampaign.collectedAmount) / Number(updatedCampaign.goalAmount)) * 100;

        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            percentageFunded,
          },
        });
      }
    } catch (error: any) {
      console.error(`✗ Error creating donations for campaign:`, error.message);
    }
  }

  console.log(`✅ Created ${donationCount} donations with notifications\n`);

  // Step 4: Create comments
  console.log("=== Step 4: Creating Comments ===\n");
  let commentCount = 0;

  const commentMessages = [
    "¡Qué gran proyecto! ¿Cómo puedo ayudar además de donar?",
    "Me encanta esta iniciativa. ¿Tienen redes sociales para seguir el progreso?",
    "Felicidades por el trabajo que están haciendo.",
    "¿Cuándo esperan completar el proyecto?",
    "Excelente causa, los apoyo totalmente.",
    "¿Hay forma de ser voluntario en este proyecto?",
  ];

  for (const campaign of createdCampaigns.slice(0, 5)) {
    try {
      const numComments = Math.floor(Math.random() * 3) + 2;
      const commenters = createdProfiles.filter((p) => p.id !== campaign.organizerId).slice(0, numComments);

      for (const commenter of commenters) {
        const comment = await prisma.comment.create({
          data: {
            campaignId: campaign.id,
            profileId: commenter.id,
            message: commentMessages[Math.floor(Math.random() * commentMessages.length)],
          },
        });

        // Create notification for campaign organizer
        await prisma.notification.create({
          data: {
            userId: campaign.organizerId,
            type: "comment_received",
            title: "Nuevo comentario",
            message: `${commenter.name} comentó en tu campaña "${campaign.title}"`,
            campaignId: campaign.id,
            commentId: comment.id,
          },
        });

        commentCount++;
      }
    } catch (error: any) {
      console.error(`✗ Error creating comments:`, error.message);
    }
  }

  console.log(`✅ Created ${commentCount} comments\n`);

  // Step 5: Create saved campaigns
  console.log("=== Step 5: Creating Saved Campaigns ===\n");
  let savedCount = 0;

  for (const user of createdProfiles.filter((p) => p.role === "user").slice(0, 4)) {
    try {
      const campaignsToSave = createdCampaigns
        .filter((c) => c.organizerId !== user.id)
        .slice(0, Math.floor(Math.random() * 3) + 1);

      for (const campaign of campaignsToSave) {
        await prisma.savedCampaign.create({
          data: {
            profileId: user.id,
            campaignId: campaign.id,
          },
        });
        savedCount++;
      }
    } catch (error: any) {
      console.error(`✗ Error creating saved campaigns:`, error.message);
    }
  }

  console.log(`✅ Created ${savedCount} saved campaigns\n`);

  // Step 6: Create notification preferences
  console.log("=== Step 6: Creating Notification Preferences ===\n");

  for (const profile of createdProfiles) {
    try {
      const existing = await prisma.notificationPreference.findUnique({
        where: { userId: profile.id },
      });

      if (!existing) {
        await prisma.notificationPreference.create({
          data: {
            userId: profile.id,
            newsUpdates: Math.random() > 0.5,
            campaignUpdates: true,
          },
        });
      }
    } catch (error: any) {
      console.error(`✗ Error creating notification preferences:`, error.message);
    }
  }

  console.log(`✅ Created notification preferences\n`);

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 SEED SUMMARY");
  console.log("=".repeat(50));
  console.log(`Users created: ${createdProfiles.length}`);
  console.log(`Campaigns created: ${createdCampaigns.length}`);
  console.log(`Donations created: ${donationCount}`);
  console.log(`Comments created: ${commentCount}`);
  console.log(`Saved campaigns: ${savedCount}`);
  console.log("=".repeat(50));
  console.log("\n✅ Seed completed successfully!");
  console.log("\nTest user credentials:");
  console.log("- admin@minka.com / Minka2024!");
  console.log("- tester@minka.com / Test123!");
  console.log("- All other test emails / Test123!\n");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
