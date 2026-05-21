import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Créer des points exemple sur la carte
  const point1 = await prisma.mapPoint.create({
    data: {
      name: 'Tour Eiffel',
      color: '#FF5733',
      date: new Date('2024-01-15'),
      address: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris',
      latitude: 48.8584,
      longitude: 2.2945,
      description: 'Visite de la Tour Eiffel',
    },
  });

  const point2 = await prisma.mapPoint.create({
    data: {
      name: 'Arc de Triomphe',
      color: '#3498DB',
      date: new Date('2024-02-20'),
      address: 'Place Charles de Gaulle, 75008 Paris',
      latitude: 48.8738,
      longitude: 2.2950,
      description: 'Vue panoramique sur Paris',
    },
  });

  const point3 = await prisma.mapPoint.create({
    data: {
      name: 'Musée du Louvre',
      color: '#2ECC71',
      date: new Date('2024-03-10'),
      address: 'Rue de Rivoli, 75001 Paris',
      latitude: 48.8606,
      longitude: 2.3376,
      description: 'Visite du plus grand musée du monde',
    },
  });

  console.log('✅ Points créés:', { point1, point2, point3 });
  console.log('✅ Seeding terminé!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
