const _ = require('lodash');
const traverse = require('traverse');

var config;

function configure(config) {
  config = config;
}

function isPrimitive(type) {
  return _.has(JAVASCRIPT_TO_AVRO_TYPE, type);
}

// TODO: Convert string to bytes or fixed as well.
const JAVASCRIPT_TO_AVRO_TYPE = {
  'null': 'null',
  'boolean': 'boolean',
  'number': getNumberAvroType,
  'string': getStringAvroType,
}

function getNumberAvroType(datum, key) {
  if (datum % 1 === 0) {
    return 'int';
  } else {
    return 'float';
  }
}

function getStringAvroType(datum, key) {
  var enumWhitelistedProperties = traverse.get(config, ['enums', 'whitelistedProperties']);
  if (enumWhitelistedProperties && _.contains(enumWhitelistedProperties, key)) {
    return 'enum';
  } else {
    return 'string';
  }
}

module.exports.configure = configure;
module.exports.isPrimitive = isPrimitive;
module.exports.JAVASCRIPT_TO_AVRO_TYPE = JAVASCRIPT_TO_AVRO_TYPE;