import { createApp } from "vue";
import { installUI } from "../ui";
import Converter from "./BackupConverter.vue";
const app = createApp(Converter);
installUI(app);
app.mount("#converter");
