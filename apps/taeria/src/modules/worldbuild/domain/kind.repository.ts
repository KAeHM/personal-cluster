import type { Kind, NewKind, UpdateKind } from "./kind";

/**
 * Port do repositório de kinds: contrato em termos de domínio, sem
 * conhecer nenhum tool de banco.
 */
export interface KindRepository {
  findById(id: string): Promise<Kind | null>;
  findBySlug(slug: string): Promise<Kind | null>;
  list(): Promise<Kind[]>;
  create(data: NewKind): Promise<Kind>;
  /** Retorna o kind atualizado, ou `null` se o id não existir. */
  update(id: string, data: UpdateKind): Promise<Kind | null>;
  /** Retorna `true` se removeu, `false` se o id não existia. */
  delete(id: string): Promise<boolean>;
}
