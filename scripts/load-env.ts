import { config } from "dotenv";

// Shell/deployment environment wins. Local overrides .env; neither is printed.
config({ path: [".env.local", ".env"], quiet: true });
