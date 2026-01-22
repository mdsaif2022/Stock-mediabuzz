import Layout from "@/components/Layout";
import { BookOpen, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function UserManual() {
  const { t } = useLanguage();
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 py-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t("manual.backToHome")}</span>
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {t("manual.title")}
                </h1>
                <p className="text-muted-foreground mt-1">{t("manual.subtitle")}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Getting Started */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-border">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                {t("manual.gettingStarted")}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.gettingStarted1")}</strong> {t("manual.gettingStarted1Desc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.gettingStarted2")}</strong> {t("manual.gettingStarted2Desc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.gettingStarted3")}</strong> {t("manual.gettingStarted3Desc")}
                  </p>
                </div>
              </div>
            </section>

            {/* Downloading Media */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-border">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                {t("manual.downloading")}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.downloading1")}</strong> {t("manual.downloading1Desc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.downloading2")}</strong> {t("manual.downloading2Desc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.downloading3")}</strong> {t("manual.downloading3Desc")}
                  </p>
                </div>
              </div>
            </section>

            {/* Categories & Types */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-border">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                {t("manual.categories")}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.categoriesVideo")}</strong> {t("manual.categoriesVideoDesc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.categoriesImages")}</strong> {t("manual.categoriesImagesDesc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.categoriesAudio")}</strong> {t("manual.categoriesAudioDesc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.categoriesTemplates")}</strong> {t("manual.categoriesTemplatesDesc")}
                  </p>
                </div>
              </div>
            </section>

            {/* Creator Portal */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-border">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                {t("manual.creator")}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.creator1")}</strong> {t("manual.creator1Desc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.creator2")}</strong> {t("manual.creator2Desc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.creator3")}</strong> {t("manual.creator3Desc")}
                  </p>
                </div>
              </div>
            </section>

            {/* Earnings & Referrals */}
            <section className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-2xl p-6 sm:p-8 shadow-sm border border-primary/20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                {t("manual.earnings")}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.earnings1")}</strong> {t("manual.earnings1Desc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.earnings2")}</strong> {t("manual.earnings2Desc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.earnings3")}</strong> {t("manual.earnings3Desc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.earnings4")}</strong> {t("manual.earnings4Desc")}
                  </p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p className="mb-2">
                    <strong className="text-foreground">{t("manual.earnings5")}</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>{t("manual.earnings5Referral")}</li>
                    <li>{t("manual.earnings5Share")}</li>
                    <li>{t("manual.earnings5Available")}</li>
                    <li>{t("manual.earnings5Pending")}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Tips & Best Practices */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-border">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                {t("manual.tips")}
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <div className="pl-4 border-l-2 border-primary/30">
                  <p>{t("manual.tips1")}</p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p>{t("manual.tips2")}</p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p>{t("manual.tips3")}</p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p>{t("manual.tips4")}</p>
                </div>
                <div className="pl-4 border-l-2 border-primary/30">
                  <p>{t("manual.tips5")}</p>
                </div>
              </div>
            </section>

            {/* Support */}
            <section className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-2xl p-6 sm:p-8 border border-primary/20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                {t("manual.needHelp")}
              </h2>
              <div className="text-muted-foreground">
                <div className="pl-4 border-l-2 border-primary/30">
                  <p>
                    {t("manual.needHelpDesc")}{" "}
                    <a href="mailto:support@freemediabuzz.com" className="text-primary hover:underline font-semibold">
                      support@freemediabuzz.com
                    </a>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

