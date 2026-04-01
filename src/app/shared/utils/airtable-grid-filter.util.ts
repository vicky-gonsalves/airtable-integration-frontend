export class AirtableGridFilterUtil {
  static parseFormulaToFilterModel(formula: string): any {
    if (!formula) return {};

    const conditionsByField: Record<string, { operator: string; conditions: any[] }> = {};

    AirtableGridFilterUtil.extractConditions(formula, conditionsByField, 'AND');

    const filterModel: any = {};

    Object.keys(conditionsByField).forEach((field) => {
      const data = conditionsByField[field];
      const conds = data.conditions;

      if (conds.length === 1) {
        filterModel[field] = conds[0];
      } else if (conds.length >= 2) {
        filterModel[field] = {
          filterType: 'text',
          operator: data.operator,
          conditions: conds,
        };
      }
    });

    return filterModel;
  }

  static extractConditions(
    formula: string,
    map: Record<string, { operator: string; conditions: any[] }>,
    currentOp: string,
  ) {
    if (!formula) return;
    formula = formula.trim();

    if (formula.startsWith('NOT(') && formula.endsWith(')')) {
      const inner = formula.substring(4, formula.length - 1).trim();
      const findMatch = inner.match(/^FIND\(['"]([^'"]+)['"],\s*\{([^}]+)\}\)$/);
      if (findMatch) {
        AirtableGridFilterUtil.addCondition(
          findMatch[2],
          { filterType: 'text', type: 'notContains', filter: findMatch[1] },
          map,
          currentOp,
        );
      }
      return;
    }

    if ((formula.startsWith('AND(') || formula.startsWith('OR(')) && formula.endsWith(')')) {
      const op = formula.startsWith('OR(') ? 'OR' : 'AND';
      const inner = formula.substring(formula.indexOf('(') + 1, formula.length - 1).trim();
      const parts = AirtableGridFilterUtil.splitByComma(inner);
      parts.forEach((p) => AirtableGridFilterUtil.extractConditions(p, map, op));
      return;
    }

    const findMatch = formula.match(
      /^(FIND|SEARCH)\(['"]([^'"]+)['"],\s*\{([^}]+)\}\)(?:\s*=\s*1)?$/,
    );
    if (findMatch) {
      const func = findMatch[1];
      const val = findMatch[2];
      const field = findMatch[3];

      let type = 'contains';
      if (formula.includes('= 1')) type = 'startsWith';
      else if (func === 'SEARCH') type = 'endsWith';

      AirtableGridFilterUtil.addCondition(
        field,
        { filterType: 'text', type, filter: val },
        map,
        currentOp,
      );
      return;
    }

    const opMatch = formula.match(/^\{([^}]+)\}\s*(=|!=|>|<|>=|<=)\s*(.+)$/);
    if (opMatch) {
      const field = opMatch[1].trim();
      const op = opMatch[2].trim();
      const valStr = opMatch[3].trim();

      if (valStr === 'BLANK()') {
        AirtableGridFilterUtil.addCondition(
          field,
          { filterType: 'text', type: op === '=' ? 'blank' : 'notBlank' },
          map,
          currentOp,
        );
        return;
      }

      const val = valStr.replace(/^['"]|['"]$/g, '');
      let type = 'equals';
      if (op === '!=') type = 'notEqual';

      AirtableGridFilterUtil.addCondition(
        field,
        { filterType: 'text', type, filter: val },
        map,
        currentOp,
      );
      return;
    }
  }

  static addCondition(
    field: string,
    condition: any,
    map: Record<string, { operator: string; conditions: any[] }>,
    operator: string,
  ) {
    if (!map[field]) {
      map[field] = { operator, conditions: [] };
    } else {
      map[field].operator = operator;
    }
    map[field].conditions.push(condition);
  }

  static splitByComma(str: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    let inQuote: string | null = null;

    for (let i = 0; i < str.length; i++) {
      const c = str[i];

      if (c === '"' || c === "'") {
        if (inQuote === c) inQuote = null;
        else if (!inQuote) inQuote = c;
      }

      if (!inQuote) {
        if (c === '(') depth++;
        if (c === ')') depth--;
        if (c === ',' && depth === 0) {
          parts.push(current.trim());
          current = '';
          continue;
        }
      }
      current += c;
    }

    if (current) parts.push(current.trim());
    return parts;
  }

  static convertGridFiltersToFormula(filterModel: any): string {
    const conditions: string[] = [];

    for (const [key, fObj] of Object.entries<any>(filterModel)) {
      if (fObj.operator) {
        let innerConds: string[] = [];
        if (Array.isArray(fObj.conditions)) {
          innerConds = fObj.conditions
            .map((c: any) => AirtableGridFilterUtil.getConditionString(key, c))
            .filter((c: string) => c);
        } else {
          const c1 = AirtableGridFilterUtil.getConditionString(key, fObj.condition1);
          const c2 = AirtableGridFilterUtil.getConditionString(key, fObj.condition2);
          if (c1) innerConds.push(c1);
          if (c2) innerConds.push(c2);
        }
        if (innerConds.length > 0) {
          conditions.push(`${fObj.operator}(${innerConds.join(', ')})`);
        }
      } else {
        const c = AirtableGridFilterUtil.getConditionString(key, fObj);
        if (c) conditions.push(c);
      }
    }

    if (conditions.length === 0) return '';
    if (conditions.length === 1) return conditions[0];
    return `AND(${conditions.join(', ')})`;
  }

  static getConditionString(field: string, fObj: any): string {
    const val = fObj.filter;
    switch (fObj.type) {
      case 'contains':
        return `FIND('${val}', {${field}})`;
      case 'notContains':
        return `NOT(FIND('${val}', {${field}}))`;
      case 'equals':
        return `{${field}} = '${val}'`;
      case 'notEqual':
        return `{${field}} != '${val}'`;
      case 'startsWith':
        return `FIND('${val}', {${field}}) = 1`;
      case 'endsWith':
        return `SEARCH('${val}', {${field}})`;
      case 'blank':
        return `{${field}} = BLANK()`;
      case 'notBlank':
        return `{${field}} != BLANK()`;
      default:
        return '';
    }
  }
}
