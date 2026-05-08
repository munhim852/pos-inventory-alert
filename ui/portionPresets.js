(function initPortionPresets(root) {
  const portionPresets = {
    normal: { label: 'Normal portion', multiplier: 1 },
    slightly_more: { label: 'More toppings', multiplier: 1.25 },
    large: { label: 'Larger portion', multiplier: 1.5 },
    extra_large: { label: 'Extra large portion', multiplier: 1.75 },
    double: { label: 'Double toppings', multiplier: 2 }
  };

  const allowedValuesByIngredient = {
    tonkotsu_broth: [0.35, 0.45, 0.5, 0.6, 0.7],
    spicy_tonkotsu_broth: [0.35, 0.45, 0.5, 0.6, 0.7],
    miso_broth: [0.35, 0.45, 0.5, 0.6, 0.7],
    ramen_noodle: [1, 1.5, 2],
    pork_chashu: [2, 3, 4],
    pork_cartilage: [1, 1.5, 2],
    minced_pork: [1, 1.5, 2],
    ajitama_egg: [0.5, 1, 1.5, 2],
    onsen_egg: [0.5, 1, 1.5, 2]
  };

  const defaultAllowedValues = [1, 1.25, 1.5, 1.75, 2];

  function allowedPortionsFor(ingredient) {
    return allowedValuesByIngredient[ingredient] ?? defaultAllowedValues;
  }

  function nearestAllowedPortion(ingredient, targetQty) {
    const allowed = allowedPortionsFor(ingredient);

    return allowed.reduce((nearest, value) => {
      const nearestDistance = Math.abs(nearest - targetQty);
      const valueDistance = Math.abs(value - targetQty);

      if (valueDistance < nearestDistance) {
        return value;
      }

      if (valueDistance === nearestDistance && value > nearest) {
        return value;
      }

      return nearest;
    }, allowed[0]);
  }

  function applyPortionPreset(defaultIngredients, presetKey) {
    const preset = portionPresets[presetKey];

    if (!preset) {
      throw new Error(`Unknown portion preset: ${presetKey}`);
    }

    return Object.fromEntries(
      Object.entries(defaultIngredients).map(([ingredient, defaultQty]) => {
        const targetQty = Number(defaultQty) * preset.multiplier;
        return [ingredient, nearestAllowedPortion(ingredient, targetQty)];
      })
    );
  }

  const api = {
    portionPresets,
    allowedPortionsFor,
    nearestAllowedPortion,
    applyPortionPreset
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.PortionPresets = api;
})(typeof window !== 'undefined' ? window : globalThis);
