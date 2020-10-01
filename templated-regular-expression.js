const partition = require("@climb/partition");
const fromEntries = require("@climb/from-entries");

const template = /\$\{(?:\<(?<captured>[^\>]+)\>|(?<uncaptured>[^\}]+))\}/g;
const extract =
    ({ captured, uncaptured }) => [!!captured, captured || uncaptured];
const matchOver = (regexp, string, result = []) =>
    (string.replace(regexp, (...args) => (result.push(args[5]))), result);

const dedupe = array => Array.from(new Set(array));
const variables = source =>
    dedupe(matchOver(template, source).map(match => extract(match)[1]));

const insert = (source, values) => new RegExp(
    source.replace(template, (...match) =>
        ((captured, name) =>
            `(?${captured ? `<${name}>` : `:`}${values[name].source})`)
        (...extract(match[5]))));

const insertAll = (tuples, values) => Object.assign(
    values,
    fromEntries(tuples.map(([name, source]) =>
        [name, insert(source, values)])));
const has = hasOwnProperty.call.bind(hasOwnProperty);
const depend = (bound, tuples) =>
    (([independent, dependent]) =>
        dependent.length <= 0 ?
            insertAll(independent, bound) :
            depend(insertAll(independent, bound), dependent))
    (partition(([,,variables]) =>
        variables.length <= 0 ||
        variables.every(variable => has(bound, variable)),
        tuples));

module.exports = function templatedRegularExpression(definitions)
{
    return depend(Object.create(null), Object
        .entries(definitions)
        .map(([name, regexp]) => [name, regexp.source])
        .map(([name, source]) => [name, source, variables(source)]));
}
