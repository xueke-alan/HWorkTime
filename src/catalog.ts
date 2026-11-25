import { createI18n, type MessageContext } from "vue-i18n";
const catalogs = WorkTimeApp.data.locales;
// Existing catalog strings use named parameters and may contain literal @, | and braces.
const i18n = createI18n({
  legacy: false,
  locale: WorkTimeApp.i18n.language,
  fallbackLocale: "zh-CN",
  messages: { "zh-CN": catalogs["zh-CN"] } as Record<
    string,
    Record<string, string>
  >,
  messageResolver: (catalog, key) =>
    (catalog as Record<string, string>)[key] ?? null,
  messageCompiler: (source) => (context: MessageContext) =>
    String(source).replace(/\{(\w+)\}/g, (match, key) =>
      String(context.named(key) ?? match),
    ),
  missingWarn: false,
  fallbackWarn: false,
});
export const catalog = i18n.global;
let loaded = "";
function synchronize() {
  const language = WorkTimeApp.i18n.language;
  if (catalogs[language] && loaded !== language) {
    catalog.setLocaleMessage(language, catalogs[language]);
    loaded = language;
  }
  catalog.locale.value = language;
}
synchronize();
document.addEventListener("worktime:languagechange", synchronize);
WorkTimeApp.i18n.setTranslator((key, values) => {
  if (loaded !== WorkTimeApp.i18n.language) synchronize();
  return catalog.t(key, values);
});
