import express from 'express';
import axios from 'axios';

const router = express.Router();

const EXTERNAL_API = 'https://pkps.hutsos.kehutanan.go.id/api-sitroom/api/akps';
const API_KEY = 'PKPS2026_SECRET_KEY_123456';

router.get('/kelompok-ps', async (req, res) => {
  try {
    const { proid, kabid, skema } = req.query as { proid: string; kabid: string; skema: string };
    if (!proid || !kabid || !skema) {
      res.status(400).json({ success: false, message: 'proid, kabid, skema wajib diisi' });
      return;
    }

    const response = await axios.get(`${EXTERNAL_API}/usulan_search`, {
      params: { proid, kabid, skema: Number(skema) },
      headers: { 'X-API-KEY': API_KEY },
      timeout: 15000,
    });

    res.json({ success: true, data: response.data?.data || [] });
  } catch (error: any) {
    console.error('External API error:', error.message);
    res.status(502).json({ success: false, message: 'Gagal mengambil data dari server eksternal' });
  }
});

export { router as externalRouter };
