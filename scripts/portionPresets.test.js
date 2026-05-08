const assert = require('assert');
const {
    applyPortionPreset,
    nearestAllowedPortion
} = require('../ui/portionPresets');

const defaultUsage = {
    tonkotsu_broth: 0.35,
    ramen_noodle: 1,
    pork_chashu: 2,
    ajitama_egg: 0.5,
    corn: 1
};

function manualOverride(presetUsage, overrides) {
    return { ...presetUsage, ...overrides };
}

assert.deepStrictEqual(applyPortionPreset(defaultUsage, 'normal'), {
    tonkotsu_broth: 0.35,
    ramen_noodle: 1,
    pork_chashu: 2,
    ajitama_egg: 0.5,
    corn: 1
});

assert.deepStrictEqual(applyPortionPreset(defaultUsage, 'slightly_more'), {
    tonkotsu_broth: 0.45,
    ramen_noodle: 1.5,
    pork_chashu: 3,
    ajitama_egg: 0.5,
    corn: 1.25
});

assert.deepStrictEqual(applyPortionPreset(defaultUsage, 'large'), {
    tonkotsu_broth: 0.5,
    ramen_noodle: 1.5,
    pork_chashu: 3,
    ajitama_egg: 1,
    corn: 1.5
});

assert.deepStrictEqual(applyPortionPreset(defaultUsage, 'double'), {
    tonkotsu_broth: 0.7,
    ramen_noodle: 2,
    pork_chashu: 4,
    ajitama_egg: 1,
    corn: 2
});

assert.strictEqual(nearestAllowedPortion('ramen_noodle', 1.25), 1.5);
assert.strictEqual(nearestAllowedPortion('ajitama_egg', 0.75), 1);
assert.strictEqual(nearestAllowedPortion('corn', 1.62), 1.5);
assert.strictEqual(nearestAllowedPortion('tonkotsu_broth', 0.4375), 0.45);

const presetUsage = applyPortionPreset(defaultUsage, 'large');
assert.deepStrictEqual(manualOverride(presetUsage, { pork_chashu: 1.5, ajitama_egg: 2 }), {
    tonkotsu_broth: 0.5,
    ramen_noodle: 1.5,
    pork_chashu: 1.5,
    ajitama_egg: 2,
    corn: 1.5
});

console.log('Portion preset tests passed.');
