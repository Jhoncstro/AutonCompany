import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { companiesTable } from "./companies";
import { z } from "zod/v4";

export const decisionRulesTable = pgTable("decision_rules", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companiesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  metric: text("metric").notNull(),
  operator: text("operator").notNull(),
  threshold: integer("threshold").notNull(),
  guidance: text("guidance").notNull(),
  enabled: boolean("enabled").notNull().default(true),
});

export const insertDecisionRuleSchema = createInsertSchema(
  decisionRulesTable,
).omit({ id: true });
export type InsertDecisionRule = z.infer<typeof insertDecisionRuleSchema>;
export type DecisionRule = typeof decisionRulesTable.$inferSelect;
