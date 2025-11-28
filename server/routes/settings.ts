import { RequestHandler } from "express";
import { promises as fs } from "fs";
import { join } from "path";
import { DATA_DIR } from "../utils/dataPath.js";

const SETTINGS_FILE = join(DATA_DIR, "settings.json");

interface PaymentSettings {
  bkashPersonal: string;
  bkashMerchant: string;
}

interface BrandingSettings {
  faviconDataUrl?: string;
}

interface GeneralSettings {
  maintenanceMode: boolean;
}

interface SettingsStore {
  payment: PaymentSettings;
  branding: BrandingSettings;
  general: GeneralSettings;
}

const DEFAULT_SETTINGS: SettingsStore = {
  payment: {
    bkashPersonal: "01783083659",
    bkashMerchant: "01918998687",
  },
  branding: {
    faviconDataUrl: "",
  },
  general: {
    maintenanceMode: false,
  },
};

async function loadSettings(): Promise<SettingsStore> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return {
      payment: {
        bkashPersonal: parsed?.payment?.bkashPersonal || DEFAULT_SETTINGS.payment.bkashPersonal,
        bkashMerchant: parsed?.payment?.bkashMerchant || DEFAULT_SETTINGS.payment.bkashMerchant,
      },
      branding: {
        faviconDataUrl: parsed?.branding?.faviconDataUrl || "",
      },
      general: {
        maintenanceMode:
          typeof parsed?.general?.maintenanceMode === "boolean"
            ? parsed.general.maintenanceMode
            : DEFAULT_SETTINGS.general.maintenanceMode,
      },
    };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      await saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    console.error("Failed to load settings:", error);
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(store: SettingsStore) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export const getPaymentSettings: RequestHandler = async (_req, res) => {
  const settings = await loadSettings();
  res.json(settings.payment);
};

export const updatePaymentSettings: RequestHandler = async (req, res) => {
  const { bkashPersonal, bkashMerchant } = req.body as Partial<PaymentSettings>;

  if (!bkashPersonal || !bkashMerchant) {
    res.status(400).json({ error: "Both bkashPersonal and bkashMerchant are required" });
    return;
  }

  const store = await loadSettings();
  store.payment = {
    bkashPersonal,
    bkashMerchant,
  };

  await saveSettings(store);
  res.json(store.payment);
};

export const getBrandingSettings: RequestHandler = async (_req, res) => {
  const settings = await loadSettings();
  res.json(settings.branding);
};

export const updateBrandingSettings: RequestHandler = async (req, res) => {
  const { faviconDataUrl } = req.body as BrandingSettings;

  const store = await loadSettings();
  store.branding = {
    faviconDataUrl: faviconDataUrl || "",
  };

  await saveSettings(store);
  res.json(store.branding);
};

export const getGeneralSettings: RequestHandler = async (_req, res) => {
  const settings = await loadSettings();
  res.json(settings.general);
};

export const updateGeneralSettings: RequestHandler = async (req, res) => {
  const { maintenanceMode } = req.body as Partial<GeneralSettings>;

  if (typeof maintenanceMode !== "boolean") {
    res.status(400).json({ error: "maintenanceMode boolean is required" });
    return;
  }

  const store = await loadSettings();
  store.general = {
    maintenanceMode,
  };

  await saveSettings(store);
  res.json(store.general);
};

