import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, filesTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import { CreateFileBody } from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
}

function detectFileType(contentType: string): string {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (
    contentType.includes("pdf") ||
    contentType.includes("document") ||
    contentType.includes("text") ||
    contentType.includes("spreadsheet") ||
    contentType.includes("presentation") ||
    contentType.includes("msword") ||
    contentType.includes("openxmlformats")
  ) return "document";
  return "other";
}

router.get("/files", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId as string;
    const { type, search } = req.query as { type?: string; search?: string };

    const conditions = [eq(filesTable.userId, userId)];

    if (type && ["image", "video", "document", "other"].includes(type)) {
      conditions.push(eq(filesTable.fileType, type));
    }
    if (search) {
      conditions.push(ilike(filesTable.name, `%${search}%`));
    }

    const files = await db
      .select()
      .from(filesTable)
      .where(and(...conditions))
      .orderBy(sql`${filesTable.createdAt} DESC`);

    const mapped = files.map((f) => ({
      ...f,
      size: Number(f.size),
      createdAt: f.createdAt.toISOString(),
    }));

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to list files");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/files", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId as string;
    const parsed = CreateFileBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid body", details: parsed.error });
    }
    const { name, size, contentType, objectPath } = parsed.data;
    const fileType = detectFileType(contentType);

    const [file] = await db
      .insert(filesTable)
      .values({ userId, name, size, contentType, fileType, objectPath })
      .returning();

    res.status(201).json({
      ...file,
      size: Number(file.size),
      createdAt: file.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create file");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/files/stats", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId as string;

    const rows = await db
      .select({
        fileType: filesTable.fileType,
        count: sql<number>`count(*)::int`,
        totalSize: sql<number>`sum(${filesTable.size})::bigint`,
      })
      .from(filesTable)
      .where(eq(filesTable.userId, userId))
      .groupBy(filesTable.fileType);

    let totalFiles = 0;
    let totalSize = 0;
    let imageCount = 0;
    let videoCount = 0;
    let documentCount = 0;
    let otherCount = 0;

    for (const row of rows) {
      const count = Number(row.count);
      const size = Number(row.totalSize) || 0;
      totalFiles += count;
      totalSize += size;
      if (row.fileType === "image") imageCount = count;
      else if (row.fileType === "video") videoCount = count;
      else if (row.fileType === "document") documentCount = count;
      else otherCount += count;
    }

    res.json({ totalFiles, totalSize, imageCount, videoCount, documentCount, otherCount });
  } catch (err) {
    req.log.error({ err }, "Failed to get file stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/files/recent", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId as string;

    const files = await db
      .select()
      .from(filesTable)
      .where(eq(filesTable.userId, userId))
      .orderBy(sql`${filesTable.createdAt} DESC`)
      .limit(10);

    const mapped = files.map((f) => ({
      ...f,
      size: Number(f.size),
      createdAt: f.createdAt.toISOString(),
    }));

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to get recent files");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/files/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId as string;
    const id = Number(req.params.id);

    const [file] = await db
      .select()
      .from(filesTable)
      .where(and(eq(filesTable.id, id), eq(filesTable.userId, userId)));

    if (!file) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({
      ...file,
      size: Number(file.size),
      createdAt: file.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get file");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/files/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId as string;
    const id = Number(req.params.id);

    const [existing] = await db
      .select()
      .from(filesTable)
      .where(and(eq(filesTable.id, id), eq(filesTable.userId, userId)));

    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    await db.delete(filesTable).where(eq(filesTable.id, id));

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete file");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
