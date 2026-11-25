import { type App } from "vue";
import { createPinia } from "pinia";
import "@hworktime/ui/theme.css";
const pinia = createPinia();
export function installUI(app: App) {
  app.use(pinia);
}
