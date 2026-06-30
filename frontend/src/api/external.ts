import { api } from './axios';

const EXTERNAL_API = 'https://pkps.hutsos.kehutanan.go.id/api-sitroom/api/akps';

export interface KelompokPS {
  id_us: string;
  provinsi: string;
  kabkota: string;
  kecamatan: string;
  desa: string;
  no_kelompok: string;
  nama_kelompok: string;
  alamat: string;
  jml_kk: number;
  luas: number;
  skema: string;
}

export const externalApi = {
  getKelompokPS: async (proid: string, kabid: string, skema: string): Promise<KelompokPS[]> => {
    // Proxy melalui backend kita untuk hindari CORS
    const response = await api.get('/external/kelompok-ps', {
      params: { proid, kabid, skema },
    });
    return response.data?.data || [];
  },
};
