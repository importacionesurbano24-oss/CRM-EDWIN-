import "server-only";
import ExcelJS from "exceljs";

/**
 * Convierte un .xlsx a texto plano tipo tabla — Claude no puede leer el
 * binario de Excel directamente, así que esto arma el texto que sí puede
 * mandarse como bloque de texto en el mensaje.
 */
export async function excelATexto(buffer: ArrayBuffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const partes: string[] = [];
  workbook.eachSheet((hoja) => {
    partes.push(`Hoja: ${hoja.name}`);
    let filasLeidas = 0;
    hoja.eachRow((row, numeroFila) => {
      // Tope de filas — evita gastar contexto/costo si suben un archivo enorme por accidente.
      if (++filasLeidas > 500) return;
      const celdas = (row.values as unknown[])
        .slice(1)
        .map((v) => (v == null ? "" : String(v)));
      partes.push(`Fila ${numeroFila}: ${celdas.join(" | ")}`);
    });
  });

  return partes.join("\n");
}
