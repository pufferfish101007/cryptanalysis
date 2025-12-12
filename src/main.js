import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'vue-simple-context-menu/dist/vue-simple-context-menu.css';

import App from './App.vue';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

app.mount('#app');
