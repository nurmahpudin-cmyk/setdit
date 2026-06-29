import { Request, Response } from 'express';
import { settingsService } from './service.js';
import { apiResponse, apiError } from '../../utils/index.js';

export class SettingsController {
  async get(_req: Request, res: Response) {
    try {
      const settings = await settingsService.get();
      apiResponse(res, settings);
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async getPublic(_req: Request, res: Response) {
    try {
      const settings = await settingsService.get();
      apiResponse(res, {
        app_name: settings.app_name,
        app_fullname: settings.app_fullname,
        tagline: settings.tagline,
        logo: settings.logo,
        logo_initial: settings.logo_initial,
      });
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const settings = await settingsService.update(req.body);
      apiResponse(res, settings, 'Settings updated');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }

  async uploadLogo(req: Request, res: Response) {
    try {
      if (!req.file) {
        apiError(res, 'Tidak ada file yang diupload', 400);
        return;
      }

      const logoUrl = `/uploads/${req.file.filename}`;
      const settings = await settingsService.update({ logo: logoUrl });
      apiResponse(res, settings, 'Logo berhasil diupload');
    } catch (error: any) {
      apiError(res, error.message, 400);
    }
  }
}

export const settingsController = new SettingsController();