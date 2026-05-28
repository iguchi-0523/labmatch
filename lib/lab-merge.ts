import { prisma } from "./db";

/**
 * クロスソース dedup ヘルパー：複数の identifier 群から Lab を見つける、
 * もしくは新規作成する。Route 4 (KAKEN) / Route 5 (researchmap) など、
 * OpenAlex 以外の経路から PI を取り込む時に使う。
 *
 * Lab の unique 識別子（schema.prisma の @unique 制約があるもの）:
 *   - openalexAuthorId
 *   - researchmapId
 *   - researcherNumber（NRID / e-Rad ID）
 *   - orcid
 *
 * 同一研究者が複数の identifier を持つ場合、最初に見つかった既存ラボに
 * 残りの identifier を merge する（後追い登録）。
 */

export interface IdentifierBundle {
  openalexAuthorId?: string | null;
  researchmapId?: string | null;
  researcherNumber?: string | null;
  orcid?: string | null;
}

export interface CreatePayload extends IdentifierBundle {
  professorName: string;
  /** 主所属の University id（呼び出し側で決定） */
  universityId: number;
  /** 任意：日本語 / 英語の研究室名（無ければ "{name} 研究室"） */
  labName?: string;
  primaryFieldCode?: string | null;
  primaryFieldName?: string | null;
}

/** identifier の少なくとも 1 つが non-empty か */
function hasAnyId(b: IdentifierBundle): boolean {
  return Boolean(
    b.openalexAuthorId ||
      b.researchmapId ||
      b.researcherNumber ||
      b.orcid,
  );
}

/**
 * 任意の identifier から既存ラボを検索。複数の identifier がそれぞれ別ラボに
 * ヒットした場合は最古（id 最小）のラボを返す。
 */
export async function findLabByIdentifiers(
  b: IdentifierBundle,
): Promise<{ id: number } | null> {
  if (!hasAnyId(b)) return null;
  const orConds: Record<string, string>[] = [];
  if (b.openalexAuthorId) orConds.push({ openalexAuthorId: b.openalexAuthorId });
  if (b.researchmapId) orConds.push({ researchmapId: b.researchmapId });
  if (b.researcherNumber)
    orConds.push({ researcherNumber: b.researcherNumber });
  if (b.orcid) orConds.push({ orcid: b.orcid });

  const hits = await prisma.lab.findMany({
    where: { OR: orConds, deletedAt: null },
    select: { id: true },
    orderBy: { id: "asc" },
    take: 5,
  });
  return hits[0] ?? null;
}

/**
 * find or create。
 * - 既存ラボあり → identifier を merge し（既存値があれば上書きしない）、id を返す
 * - 既存ラボなし → 新規作成して id を返す
 *
 * 戻り値:
 *   - { labId, created: true } 新規作成
 *   - { labId, created: false } 既存にマージ
 */
export async function upsertLabByIdentifiers(
  payload: CreatePayload,
): Promise<{ labId: number; created: boolean }> {
  const existing = await findLabByIdentifiers(payload);
  if (existing) {
    // identifier merge：null → 値、値 → 値（上書きしない）
    const cur = await prisma.lab.findUnique({
      where: { id: existing.id },
      select: {
        openalexAuthorId: true,
        researchmapId: true,
        researcherNumber: true,
        orcid: true,
      },
    });
    if (!cur) return { labId: existing.id, created: false };
    const updates: IdentifierBundle = {};
    if (!cur.openalexAuthorId && payload.openalexAuthorId)
      updates.openalexAuthorId = payload.openalexAuthorId;
    if (!cur.researchmapId && payload.researchmapId)
      updates.researchmapId = payload.researchmapId;
    if (!cur.researcherNumber && payload.researcherNumber)
      updates.researcherNumber = payload.researcherNumber;
    if (!cur.orcid && payload.orcid) updates.orcid = payload.orcid;
    if (Object.keys(updates).length > 0) {
      await prisma.lab.update({
        where: { id: existing.id },
        data: updates,
      });
    }
    return { labId: existing.id, created: false };
  }

  // 新規作成
  const lab = await prisma.lab.create({
    data: {
      universityId: payload.universityId,
      name: payload.labName ?? `${payload.professorName} 研究室`,
      professorName: payload.professorName,
      openalexAuthorId: payload.openalexAuthorId ?? null,
      researchmapId: payload.researchmapId ?? null,
      researcherNumber: payload.researcherNumber ?? null,
      orcid: payload.orcid ?? null,
      primaryFieldCode: payload.primaryFieldCode ?? null,
      primaryFieldName: payload.primaryFieldName ?? null,
    },
  });
  return { labId: lab.id, created: true };
}

/**
 * 研究室と大学を LabAffiliation でリンクする（idempotent）。
 */
export async function linkAffiliation(
  labId: number,
  universityId: number,
  isPrimary = false,
): Promise<void> {
  await prisma.labAffiliation.upsert({
    where: {
      labId_universityId: { labId, universityId },
    },
    update: isPrimary ? { isPrimary: true } : {},
    create: { labId, universityId, isPrimary },
  });
}
