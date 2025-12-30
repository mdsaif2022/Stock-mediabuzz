import { RequestHandler } from "express";
import { promises as fs } from "fs";
import { join } from "path";
import { DATA_DIR } from "../utils/dataPath.js";

const SETTINGS_FILE = join(DATA_DIR, "settings.json");

interface PaymentSettings {
  bkashPersonal: string;
  bkashMerchant: string;
  autoPaymentEnabled: boolean;
}

interface BrandingSettings {
  faviconDataUrl?: string;
  logo?: string;
}

interface GeneralSettings {
  maintenanceMode: boolean;
}

interface AppSettings {
  appName?: string;
  appVersion?: string;
  appDescription?: string;
  apkUrl?: string;
  xapkUrl?: string;
  appIcon?: string;
  downloadEnabled: boolean;
  playStoreUrl?: string;
  appStoreUrl?: string;
}

interface SettingsStore {
  payment: PaymentSettings;
  branding: BrandingSettings;
  general: GeneralSettings;
  app: AppSettings;
}

const DEFAULT_SETTINGS: SettingsStore = {
  payment: {
    bkashPersonal: "01783083659",
    bkashMerchant: "01918998687",
    autoPaymentEnabled: true,
  },
  branding: {
    faviconDataUrl: "",
    logo: "",
  },
  general: {
    maintenanceMode: false,
  },
  app: {
    appName: "",
    appVersion: "",
    appDescription: "",
    apkUrl: "",
    xapkUrl: "",
    appIcon: "",
    downloadEnabled: false,
    playStoreUrl: "",
    appStoreUrl: "",
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
        autoPaymentEnabled: typeof parsed?.payment?.autoPaymentEnabled === "boolean" 
          ? parsed.payment.autoPaymentEnabled 
          : DEFAULT_SETTINGS.payment.autoPaymentEnabled,
      },
      branding: {
        faviconDataUrl: parsed?.branding?.faviconDataUrl || "",
        logo: parsed?.branding?.logo || "",
      },
      general: {
        maintenanceMode:
          typeof parsed?.general?.maintenanceMode === "boolean"
            ? parsed.general.maintenanceMode
            : DEFAULT_SETTINGS.general.maintenanceMode,
      },
      app: {
        appName: parsed?.app?.appName || "",
        appVersion: parsed?.app?.appVersion || "",
        appDescription: parsed?.app?.appDescription || "",
        apkUrl: parsed?.app?.apkUrl || "",
        xapkUrl: parsed?.app?.xapkUrl || "",
        appIcon: parsed?.app?.appIcon || "",
        downloadEnabled: typeof parsed?.app?.downloadEnabled === "boolean" ? parsed.app.downloadEnabled : false,
        playStoreUrl: parsed?.app?.playStoreUrl || "",
        appStoreUrl: parsed?.app?.appStoreUrl || "",
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
  const { bkashPersonal, bkashMerchant, autoPaymentEnabled } = req.body as Partial<PaymentSettings>;

  if (!bkashPersonal || !bkashMerchant) {
    res.status(400).json({ error: "Both bkashPersonal and bkashMerchant are required" });
    return;
  }

  const store = await loadSettings();
  store.payment = {
    bkashPersonal,
    bkashMerchant,
    autoPaymentEnabled: typeof autoPaymentEnabled === "boolean" ? autoPaymentEnabled : store.payment.autoPaymentEnabled,
  };

  await saveSettings(store);
  res.json(store.payment);
};

export const getBrandingSettings: RequestHandler = async (_req, res) => {
  const settings = await loadSettings();
  res.json(settings.branding);
};

export const updateBrandingSettings: RequestHandler = async (req, res) => {
  const { faviconDataUrl, logo } = req.body as BrandingSettings;

  const store = await loadSettings();
  store.branding = {
    faviconDataUrl: faviconDataUrl !== undefined ? (faviconDataUrl || "") : store.branding.faviconDataUrl,
    logo: logo !== undefined ? (logo || "") : store.branding.logo,
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

export const getAppSettings: RequestHandler = async (_req, res) => {
  const settings = await loadSettings();
  res.json(settings.app);
};

export const updateAppSettings: RequestHandler = async (req, res) => {
  const {
    appName,
    appVersion,
    appDescription,
    apkUrl,
    xapkUrl,
    appIcon,
    downloadEnabled,
    playStoreUrl,
    appStoreUrl,
  } = req.body as Partial<AppSettings>;

  const store = await loadSettings();
  store.app = {
    appName: appName !== undefined ? appName : store.app.appName,
    appVersion: appVersion !== undefined ? appVersion : store.app.appVersion,
    appDescription: appDescription !== undefined ? appDescription : store.app.appDescription,
    apkUrl: apkUrl !== undefined ? apkUrl : store.app.apkUrl,
    xapkUrl: xapkUrl !== undefined ? xapkUrl : store.app.xapkUrl,
    appIcon: appIcon !== undefined ? appIcon : store.app.appIcon,
    downloadEnabled: typeof downloadEnabled === "boolean" ? downloadEnabled : store.app.downloadEnabled,
    playStoreUrl: playStoreUrl !== undefined ? playStoreUrl : store.app.playStoreUrl,
    appStoreUrl: appStoreUrl !== undefined ? appStoreUrl : store.app.appStoreUrl,
  };

  await saveSettings(store);
  res.json(store.app);
};

