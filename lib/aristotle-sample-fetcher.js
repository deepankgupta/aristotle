#! /usr/bin/env node
const q = require('q');

function fetch() {
  var data = {
    'my.sample.namespace': [{
      myint: 3,
      myfloat: 4.5,
      mystring: 'hello'
    }]
  };
  return q(data);
}

if (require.main === module) {
  var res = fetch();
  res.then(console.log);
}

module.exports.fetch = fetch;
