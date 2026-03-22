// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output:'static',
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
