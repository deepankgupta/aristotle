#! /usr/bin/env node
const q = require('q');

function fetch() {
  var data = {
    'my.sample.namespace.primitivesObject': [{
      myint: 3,
      myfloat: 4.5,
      mystring: 'hello',
      myEnum: 'val'
    }],
    'my.sample.namespace.arrayObject': [{
      myArrayOfInts: [3, 4, 5],
      myArrayOfUnions: [3, 'string', 4.5]
    }],
    'my.sample.namespace.mapObject': [{
      mapOfInts: {
        key1: 1,
        key2: 2,
        key3: 3
      }
    }],
    'my.sample.namespace.mapObject': [{
      mapOfArrays: {
        key1: [1, 2, 3],
        key2: [2, 4, 5]
      }
    }]
  };
  return q(data);
}

if (require.main === module) {
  var res = fetch();
  res.then(console.log);
}

module.exports.fetch = fetch;
