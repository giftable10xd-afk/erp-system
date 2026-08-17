import "dotenv/config";
import { evaluateAlerts } from "../src/workers/alert-evaluator.ts";

await evaluateAlerts();
console.log("evaluated once");
process.exit(0);
