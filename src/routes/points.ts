import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET tous les points
router.get('/', async (req, res) => {
  try {
    const points = await prisma.mapPoint.findMany({
      orderBy: {
        date: 'desc',
      },
    });
    res.json(points);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des points' });
  }
});

// GET un point par ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const point = await prisma.mapPoint.findUnique({
      where: { id },
    });
    if (!point) {
      return res.status(404).json({ error: 'Point non trouvé' });
    }
    res.json(point);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du point' });
  }
});

// POST créer un point
router.post('/', async (req, res) => {
  const { name, color, date, address, latitude, longitude, description } = req.body;
  
  try {
    const point = await prisma.mapPoint.create({
      data: {
        name,
        color,
        date: new Date(date),
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description,
      },
    });
    res.status(201).json(point);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la création du point' });
  }
});

// PUT mettre à jour un point
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, color, date, address, latitude, longitude, description } = req.body;
  
  try {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (date !== undefined) updateData.date = new Date(date);
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (description !== undefined) updateData.description = description;

    const point = await prisma.mapPoint.update({
      where: { id },
      data: updateData,
    });
    res.json(point);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du point' });
  }
});

// DELETE supprimer un point
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.mapPoint.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du point' });
  }
});

export default router;
