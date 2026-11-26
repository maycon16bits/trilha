// D24 (em aberto): hoje o menor de idade preenche o formulário sozinho, então
// o responsável NÃO é exigido. Quando o curso decidir, esta é a única linha
// a mudar (ou a regra a ajustar).
const GUARDIAN_REQUIRED_FOR_MINORS = false;

export function isGuardianRequired(
  isMinor: boolean,
  requiredForMinors: boolean = GUARDIAN_REQUIRED_FOR_MINORS,
): boolean {
  return requiredForMinors && isMinor;
}
