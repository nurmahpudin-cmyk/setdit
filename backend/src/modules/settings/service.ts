import { prisma } from '../../config/database.js';

export class SettingsService {
  async get() {
    let settings = await prisma.mst_settings.findFirst();

    if (!settings) {
      settings = await prisma.mst_settings.create({
        data: {
          app_name: 'SETDIT',
          app_fullname: 'Sistem Terpadu',
        },
      });
    }

    return settings;
  }

  async update(data: {
    app_name?: string;
    app_fullname?: string;
    tagline?: string;
    description?: string;
    logo?: string;
    logo_initial?: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
    const settings = await this.get();

    return prisma.mst_settings.update({
      where: { id: settings.id },
      data,
    });
  }
}

export const settingsService = new SettingsService();