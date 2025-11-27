export function evaluateExpression(expression: string): string | null {
  if (!expression) return null;

  try {
    // Normaliza a expressão:
    // 1. Substitui vírgula por ponto
    // 2. Substitui 'x' ou 'X' por '*'
    // 3. Remove caracteres não permitidos (segurança adicional)
    let sanitized = expression
      .replace(/,/g, '.')
      .replace(/x/yi, '*')
      .replace(/[^\d.+\-*/()\s]/g, '');

    // Verifica se a expressão contém apenas números (sem operadores)
    // Se for apenas um número, não precisamos calcular, mas retornamos normalizado
    if (/^[\d.\s]*$/.test(sanitized)) {
        // Se for só número, vamos formatar para garantir consistência (ex: remover espaços)
        const val = parseFloat(sanitized);
        return isNaN(val) ? null : val.toString().replace('.', ',');
    }

    // Avalia a expressão
    // Usamos new Function para evitar eval direto, embora com a sanitização o risco seja baixo
    // Retorna o resultado
    const result = new Function(`return (${sanitized})`)();

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      // Arredonda para 2 casas decimais se necessário e converte de volta para vírgula
      // Usamos Math.round((num + Number.EPSILON) * 100) / 100 para evitar erros de ponto flutuante
      const rounded = Math.round((result + Number.EPSILON) * 100) / 100;
      return rounded.toString().replace('.', ',');
    }
    
    return null;
  } catch (error) {
    // Em caso de erro de sintaxe (ex: "10 +"), retornamos null
    return null;
  }
}

export function isExpression(value: string): boolean {
  // Verifica se a string contém operadores matemáticos
  return /[+\-*/x]/i.test(value);
}

