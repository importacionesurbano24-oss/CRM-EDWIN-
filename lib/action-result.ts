// La rama de error admite `data` parcial para casos como "se creó el cliente
// pero falló el paso siguiente" — el llamador puede decidir si es fatal.
export type ActionResult<T> =
  | { data: T; error: null }
  | { data: T | null; error: string };
