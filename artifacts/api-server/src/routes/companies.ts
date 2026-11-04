import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateCompanyBody,
  CreateDecisionRuleBody,
  CreateOperationBody,
  DeleteDecisionRuleParams,
  DeleteOperationParams,
  GetCompanyAnalyticsParams,
  GetCompanyAnalyticsResponse,
  GetCompanyDashboardParams,
  GetCompanyDashboardResponse,
  GetCompanyInsightsParams,
  GetCompanyInsightsResponse,
  ListCompaniesResponse,
  ListCompanyOperationsParams,
  ListCompanyOperationsResponse,
  ListCompanyRulesParams,
  ListCompanyRulesResponse,
  UpdateDecisionRuleBody,
  UpdateDecisionRuleParams,
  UpdateOperationBody,
  UpdateOperationParams,
} from "@workspace/api-zod";
import {
  companiesTable,
  db,
  decisionRulesTable,
  operationsTable,
} from "@workspace/db";

const router: IRouter = Router();

type OperationRow = typeof operationsTable.$inferSelect;

function serializeOperation(operation: OperationRow) {
  return {
    ...operation,
    createdAt: operation.createdAt.toISOString(),
  };
}

function compareMetric(actual: number, operator: string, threshold: number) {
  switch (operator) {
    case "gt":
      return actual > threshold;
    case "gte":
      return actual >= threshold;
    case "lt":
      return actual < threshold;
    case "lte":
      return actual <= threshold;
    default:
      return false;
  }
}

function normalizeDueDate(value: Date | string | null | undefined) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value ?? null;
}

router.get("/companies", async (_req, res): Promise<void> => {
  const companies = await db
    .select()
    .from(companiesTable)
    .orderBy(companiesTable.name);
  res.json(
    ListCompaniesResponse.parse(
      companies.map((company) => ({
        ...company,
        createdAt: company.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/companies", async (req, res): Promise<void> => {
  const parsed = CreateCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [company] = await db
    .insert(companiesTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(
    ListCompaniesResponse.element.parse({
      ...company,
      createdAt: company.createdAt.toISOString(),
    }),
  );
});

router.get(
  "/companies/:companyId/dashboard",
  async (req, res): Promise<void> => {
    const parsed = GetCompanyDashboardParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [company] = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .where(eq(companiesTable.id, parsed.data.companyId));
    if (!company) {
      res.status(404).json({ error: "Empresa não encontrada." });
      return;
    }

    const operations = await db
      .select()
      .from(operationsTable)
      .where(eq(operationsTable.companyId, parsed.data.companyId))
      .orderBy(desc(operationsTable.createdAt));
    const today = new Date().toISOString().slice(0, 10);
    const openOperations = operations.filter(
      (operation) => operation.status === "open",
    ).length;
    const inProgressOperations = operations.filter(
      (operation) => operation.status === "in_progress",
    ).length;
    const completedOperations = operations.filter(
      (operation) => operation.status === "done",
    ).length;
    const overdueOperations = operations.filter(
      (operation) =>
        operation.status !== "done" &&
        operation.dueDate !== null &&
        operation.dueDate < today,
    ).length;
    const highPriorityOperations = operations.filter(
      (operation) =>
        operation.status !== "done" && operation.priority === "high",
    ).length;
    const total = operations.length;
    const summary = {
      openOperations,
      inProgressOperations,
      completedOperations,
      overdueOperations,
      highPriorityOperations,
      completionRate:
        total === 0 ? 0 : (completedOperations / total) * 100,
      recentOperations: operations.slice(0, 5).map(serializeOperation),
    };

    res.json(GetCompanyDashboardResponse.parse(summary));
  },
);

router.get(
  "/companies/:companyId/operations",
  async (req, res): Promise<void> => {
    const parsed = ListCompanyOperationsParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const operations = await db
      .select()
      .from(operationsTable)
      .where(eq(operationsTable.companyId, parsed.data.companyId))
      .orderBy(desc(operationsTable.createdAt));
    res.json(
      ListCompanyOperationsResponse.parse(operations.map(serializeOperation)),
    );
  },
);

router.post(
  "/companies/:companyId/operations",
  async (req, res): Promise<void> => {
    const params = ListCompanyOperationsParams.safeParse(req.params);
    const body = CreateOperationBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({
        error: !params.success
          ? params.error.message
          : body.error?.message ?? "Dados inválidos.",
      });
      return;
    }
    const [company] = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .where(eq(companiesTable.id, params.data.companyId));
    if (!company) {
      res.status(404).json({ error: "Empresa não encontrada." });
      return;
    }
    const [operation] = await db
      .insert(operationsTable)
      .values({
        ...body.data,
        companyId: params.data.companyId,
        dueDate: normalizeDueDate(body.data.dueDate),
        completedAt: body.data.status === "done" ? new Date() : null,
      })
      .returning();
    res.status(201).json(
      ListCompanyOperationsResponse.element.parse(
        serializeOperation(operation),
      ),
    );
  },
);

router.patch(
  "/operations/:operationId",
  async (req, res): Promise<void> => {
    const params = UpdateOperationParams.safeParse(req.params);
    const body = UpdateOperationBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({
        error: !params.success
          ? params.error.message
          : body.error?.message ?? "Dados inválidos.",
      });
      return;
    }
    const update = {
      ...body.data,
      dueDate:
        body.data.dueDate === undefined
          ? undefined
          : normalizeDueDate(body.data.dueDate),
      ...(body.data.status === "done"
        ? { completedAt: new Date() }
        : body.data.status
          ? { completedAt: null }
          : {}),
    };
    const [operation] = await db
      .update(operationsTable)
      .set(update)
      .where(eq(operationsTable.id, params.data.operationId))
      .returning();
    if (!operation) {
      res.status(404).json({ error: "Operação não encontrada." });
      return;
    }
    res.json(
      ListCompanyOperationsResponse.element.parse(
        serializeOperation(operation),
      ),
    );
  },
);

router.delete(
  "/operations/:operationId",
  async (req, res): Promise<void> => {
    const params = DeleteOperationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [deleted] = await db
      .delete(operationsTable)
      .where(eq(operationsTable.id, params.data.operationId))
      .returning({ id: operationsTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Operação não encontrada." });
      return;
    }
    res.sendStatus(204);
  },
);

router.get(
  "/companies/:companyId/rules",
  async (req, res): Promise<void> => {
    const parsed = ListCompanyRulesParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const rules = await db
      .select()
      .from(decisionRulesTable)
      .where(eq(decisionRulesTable.companyId, parsed.data.companyId))
      .orderBy(decisionRulesTable.name);
    res.json(ListCompanyRulesResponse.parse(rules));
  },
);

router.post(
  "/companies/:companyId/rules",
  async (req, res): Promise<void> => {
    const params = ListCompanyRulesParams.safeParse(req.params);
    const body = CreateDecisionRuleBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({
        error: !params.success
          ? params.error.message
          : body.error?.message ?? "Dados inválidos.",
      });
      return;
    }
    const [company] = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .where(eq(companiesTable.id, params.data.companyId));
    if (!company) {
      res.status(404).json({ error: "Empresa não encontrada." });
      return;
    }
    const [rule] = await db
      .insert(decisionRulesTable)
      .values({ ...body.data, companyId: params.data.companyId })
      .returning();
    res.status(201).json(
      ListCompanyRulesResponse.element.parse(rule),
    );
  },
);

router.patch("/rules/:ruleId", async (req, res): Promise<void> => {
  const params = UpdateDecisionRuleParams.safeParse(req.params);
  const body = UpdateDecisionRuleBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      error: !params.success
        ? params.error.message
        : body.error?.message ?? "Dados inválidos.",
    });
    return;
  }
  const [rule] = await db
    .update(decisionRulesTable)
    .set(body.data)
    .where(eq(decisionRulesTable.id, params.data.ruleId))
    .returning();
  if (!rule) {
    res.status(404).json({ error: "Regra não encontrada." });
    return;
  }
  res.json(ListCompanyRulesResponse.element.parse(rule));
});

router.delete("/rules/:ruleId", async (req, res): Promise<void> => {
  const params = DeleteDecisionRuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(decisionRulesTable)
    .where(eq(decisionRulesTable.id, params.data.ruleId))
    .returning({ id: decisionRulesTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Regra não encontrada." });
    return;
  }
  res.sendStatus(204);
});

router.get(
  "/companies/:companyId/analytics",
  async (req, res): Promise<void> => {
    const params = GetCompanyAnalyticsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const operations = await db
      .select()
      .from(operationsTable)
      .where(eq(operationsTable.companyId, params.data.companyId));

    const now = new Date();
    const monthly = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - index),
        1,
      );
      const month = `${monthDate.getFullYear()}-${String(
        monthDate.getMonth() + 1,
      ).padStart(2, "0")}`;
      const nextMonth = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        1,
      );
      return {
        month,
        opened: operations.filter(
          (operation) =>
            operation.createdAt >= monthDate && operation.createdAt < nextMonth,
        ).length,
        completed: operations.filter(
          (operation) =>
            operation.completedAt !== null &&
            operation.completedAt >= monthDate &&
            operation.completedAt < nextMonth,
        ).length,
      };
    });
    const categoryCounts = new Map<string, number>();
    const statusCounts = new Map<string, number>();
    for (const operation of operations) {
      categoryCounts.set(
        operation.category,
        (categoryCounts.get(operation.category) ?? 0) + 1,
      );
      statusCounts.set(
        operation.status,
        (statusCounts.get(operation.status) ?? 0) + 1,
      );
    }
    const report = {
      monthly,
      categories: [...categoryCounts].map(([category, count]) => ({
        category,
        count,
      })),
      statuses: [...statusCounts].map(([status, count]) => ({
        status,
        count,
      })),
    };
    res.json(GetCompanyAnalyticsResponse.parse(report));
  },
);

router.get(
  "/companies/:companyId/insights",
  async (req, res): Promise<void> => {
    const params = GetCompanyInsightsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const companyId = params.data.companyId;
    const [company] = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId));
    if (!company) {
      res.status(404).json({ error: "Empresa não encontrada." });
      return;
    }
    const [operations, rules] = await Promise.all([
      db
        .select()
        .from(operationsTable)
        .where(eq(operationsTable.companyId, companyId)),
      db
        .select()
        .from(decisionRulesTable)
        .where(
          and(
            eq(decisionRulesTable.companyId, companyId),
            eq(decisionRulesTable.enabled, true),
          ),
        ),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const metrics = {
      overdue_operations: operations.filter(
        (operation) =>
          operation.status !== "done" &&
          operation.dueDate !== null &&
          operation.dueDate < today,
      ).length,
      high_priority_operations: operations.filter(
        (operation) =>
          operation.status !== "done" && operation.priority === "high",
      ).length,
      open_operations: operations.filter(
        (operation) => operation.status !== "done",
      ).length,
    };
    const insights = rules.flatMap((rule) => {
      const actualValue = metrics[
        rule.metric as keyof typeof metrics
      ];
      if (!compareMetric(actualValue, rule.operator, rule.threshold)) {
        return [];
      }
      const severity =
        rule.metric === "overdue_operations" && actualValue > 0
          ? "high"
          : actualValue >= rule.threshold * 2
            ? "high"
            : "medium";
      return [
        {
          id: `rule-${rule.id}`,
          ruleName: rule.name,
          metric: rule.metric,
          actualValue,
          threshold: rule.threshold,
          guidance: rule.guidance,
          severity,
        },
      ];
    });
    res.json(GetCompanyInsightsResponse.parse(insights));
  },
);

export default router;
