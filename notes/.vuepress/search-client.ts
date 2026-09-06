import { defineClientConfig } from "vuepress/client"
import SearchDialog from "./components/SearchDialog.vue"
export default defineClientConfig({
  enhance({app}) { app.component("SearchBox", SearchDialog) },
})
