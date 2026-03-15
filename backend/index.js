import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function connectDB() {
    try {
        await prisma.$connect();
        console.log('Successfully connected to the database via Prisma');
    } catch (error) {
        console.error('Failed to connect to the database', error);
        process.exit(1);
    }
}

connectDB();

// --- CRUD APIs for URLs ---

// CREATE a new URL
app.post('/api/urls', async (req, res) => {
    try {
        const { link } = req.body;
        if (!link) {
            return res.status(400).json({ error: 'Link is required' });
        }

        const newUrl = await prisma.url.create({
            data: {
                link,
            },
        });

        res.status(201).json(newUrl);
    } catch (error) {
        // Handle unique constraint violation (if link already exists)
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'This URL already exists' });
        }
        console.info("Error creating URL:", error);
        res.status(500).json({ error: 'Failed to create URL' });
    }
});

// READ all URLs
app.get('/api/urls', async (req, res) => {
    try {
        const urls = await prisma.url.findMany({
            orderBy: { createdAt: 'desc' },
            include: { analytics: true }
        });
        res.status(200).json(urls);
    } catch (error) {
        console.error("Error fetching URLs:", error);
        res.status(500).json({ error: 'Failed to fetch URLs' });
    }
});

// READ a single URL by ID
app.get('/api/urls/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const url = await prisma.url.findUnique({
            where: { id },
            include: { analytics: true } // Include related analytics if needed
        });

        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        // --- Track Analytics ---
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const referrer = req.headers['referer'] || req.headers['referrer'];

        await prisma.analytics.create({
            data: {
                urlId: id,
                ip: ip || null,
                userAgent: userAgent || null,
                referrer: referrer || null,
            }
        });
        // -----------------------

        res.status(200).json(url);
    } catch (error) {
        console.error("Error fetching URL:", error);
        res.status(500).json({ error: 'Failed to fetch URL' });
    }
});

// UPDATE a URL by ID
app.put('/api/urls/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { link } = req.body;

        const updatedUrl = await prisma.url.update({
            where: { id },
            data: { link },
        });

        res.status(200).json(updatedUrl);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'URL not found' });
        }
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'This URL already exists' });
        }
        console.error("Error updating URL:", error);
        res.status(500).json({ error: 'Failed to update URL' });
    }
});

// DELETE a URL by ID
app.delete('/api/urls/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Due to the relation with Analytics, we might need to delete related analytics first
        // Or ensure `onDelete: Cascade` is set in the schema.
        // Assuming we just delete the URL for now:
        await prisma.url.delete({
            where: { id },
        });

        res.status(200).json({ message: 'URL deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'URL not found' });
        }
        console.error("Error deleting URL:", error);
        res.status(500).json({ error: 'Failed to delete URL' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default prisma;
