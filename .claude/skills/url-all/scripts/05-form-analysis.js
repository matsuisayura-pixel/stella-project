// 05-form-analysis.js - フォーム要素・バリデーション解析
// Usage: browser_run_code で実行
async (page) => {
  return await page.evaluate(() => {
    const result = {
      forms: [],
      standaloneInputs: [],
      summary: {}
    };

    // Analyze forms
    document.querySelectorAll('form').forEach((form, idx) => {
      const fields = [];

      form.querySelectorAll('input, select, textarea, button').forEach(el => {
        const field = {
          tag: el.tagName.toLowerCase(),
          type: el.type || null,
          name: el.name || null,
          id: el.id || null,
          placeholder: el.placeholder || null,
          required: el.required,
          pattern: el.getAttribute('pattern') || null,
          minLength: el.minLength > 0 ? el.minLength : null,
          maxLength: el.maxLength > 0 ? el.maxLength : null,
          min: el.getAttribute('min'),
          max: el.getAttribute('max'),
          step: el.getAttribute('step'),
          autocomplete: el.autocomplete || null,
          ariaLabel: el.getAttribute('aria-label') || null,
          hasLabel: !!el.id && !!document.querySelector(`label[for="${el.id}"]`),
          disabled: el.disabled,
          readOnly: el.readOnly || false
        };

        if (el.tagName === 'SELECT') {
          field.options = Array.from(el.options).map(o => ({
            value: o.value,
            text: o.text,
            selected: o.selected
          }));
        }

        if (el.tagName === 'BUTTON' || el.type === 'submit') {
          field.buttonText = el.textContent.trim().substring(0, 100);
        }

        fields.push(field);
      });

      result.forms.push({
        index: idx,
        action: form.action || null,
        method: form.method || 'get',
        enctype: form.enctype || null,
        id: form.id || null,
        name: form.name || null,
        novalidate: form.noValidate,
        autocomplete: form.autocomplete || null,
        fieldCount: fields.length,
        fields: fields
      });
    });

    // Standalone inputs (not in a form)
    document.querySelectorAll('input:not(form input), select:not(form select), textarea:not(form textarea)').forEach(el => {
      result.standaloneInputs.push({
        tag: el.tagName.toLowerCase(),
        type: el.type || null,
        name: el.name || null,
        id: el.id || null,
        placeholder: el.placeholder || null,
        ariaLabel: el.getAttribute('aria-label') || null,
        role: el.getAttribute('role') || null
      });
    });

    // Summary
    result.summary = {
      totalForms: result.forms.length,
      totalFields: result.forms.reduce((sum, f) => sum + f.fieldCount, 0),
      formsWithAction: result.forms.filter(f => f.action && !f.action.endsWith(location.pathname)).length,
      formsWithValidation: result.forms.filter(f => f.fields.some(field => field.required || field.pattern)).length,
      standaloneInputs: result.standaloneInputs.length,
      fieldTypes: (() => {
        const types = {};
        result.forms.forEach(f => f.fields.forEach(field => {
          const t = field.type || field.tag;
          types[t] = (types[t] || 0) + 1;
        }));
        return types;
      })()
    };

    return result;
  });
}
